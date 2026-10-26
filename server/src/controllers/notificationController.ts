import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { unreadOnly } = req.query;

    const query: any = {
      $or: [
        { userId: user._id },
        { targetRole: user.role },
      ],
    };

    if (user.role === 'institution' && user.institutionId) {
      query.$or.push({ institutionId: user.institutionId });
    }

    if (unreadOnly === 'true') {
      query.readAt = null;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      ...query,
      readAt: null,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching notifications.' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error marking notification as read.' });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const query: any = {
      $or: [
        { userId: user._id },
        { targetRole: user.role },
      ],
      readAt: null,
    };

    if (user.role === 'institution' && user.institutionId) {
      query.$or.push({ institutionId: user.institutionId });
    }

    await Notification.updateMany(query, { readAt: new Date() });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating notifications.' });
  }
}
