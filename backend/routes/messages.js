const express = require('express');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// الحصول على الرسائل بين مستخدمين
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    })
      .populate('sender', 'firstName lastName profileImage')
      .populate('receiver', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// إرسال رسالة
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ error: 'المستقبل والمحتوى مطلوبان' });
    }

    const message = new Message({
      sender: req.userId,
      receiver,
      content
    });

    await message.save();
    await message.populate('sender', 'firstName lastName profileImage');
    await message.populate('receiver', 'firstName lastName profileImage');

    res.status(201).json({
      message: 'تم إرسال الرسالة بنجاح',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تحديد الرسائل كمقروءة
router.put('/read/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json({ message: 'تم تحديث حالة الرسالة', data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
