const queue = [];
const partners = new Map();
const reports = [];

function tagsScore(a, b) {
  if (!a.tags?.length || !b.tags?.length) return 0;
  return a.tags.filter((t) => b.tags.includes(t)).length;
}

function isCompatible(a, b) {
  const aWantsB = a.lookingFor === 'any' || a.lookingFor === b.gender || b.gender === 'any';
  const bWantsA = b.lookingFor === 'any' || b.lookingFor === a.gender || a.gender === 'any';
  return aWantsB && bWantsA;
}

function broadcastCount(io) {
  io.emit('online-count', io.sockets.sockets.size);
}

function findBestMatch(queue, me, io) {
  let bestIdx = -1;
  let bestScore = -1;

  queue.forEach((u, idx) => {
    const s = io.sockets.sockets.get(u.id);
    if (!s || !isCompatible(me, u)) return;
    const score = tagsScore(me, u);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

function registerChatHandlers(io, socket) {
  broadcastCount(io);

  socket.on('next', ({ gender = 'any', lookingFor = 'any', tags = [] } = {}) => {
    const me = { id: socket.id, gender, lookingFor, tags };

    const idx = queue.findIndex((u) => u.id === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const partnerId = partners.get(socket.id);
    if (partnerId) {
      partners.delete(socket.id);
      partners.delete(partnerId);
      io.to(partnerId).emit('partner-disconnected');
    }

    const matchIdx = findBestMatch(queue, me, io);

    if (matchIdx !== -1) {
      const waiting = queue.splice(matchIdx, 1)[0];
      const waitingSocket = io.sockets.sockets.get(waiting.id);
      partners.set(socket.id, waiting.id);
      partners.set(waiting.id, socket.id);
      const sharedTags = me.tags.filter((t) => waiting.tags.includes(t));
      socket.emit('matched', {
        initiator: true,
        partnerName: waitingSocket.user.name,
        sharedTags,
      });
      waitingSocket.emit('matched', {
        initiator: false,
        partnerName: socket.user.name,
        sharedTags,
      });
    } else {
      queue.push(me);
    }
  });

  socket.on('offer', (offer) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('ice-candidate', candidate);
  });

  socket.on('message', ({ text, id } = {}) => {
    const partnerId = partners.get(socket.id);
    if (partnerId && text) io.to(partnerId).emit('message', { text, id });
  });

  socket.on('typing', (isTyping) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('partner-typing', Boolean(isTyping));
  });

  socket.on('reaction', ({ emoji, msgId } = {}) => {
    const partnerId = partners.get(socket.id);
    if (partnerId && emoji) io.to(partnerId).emit('reaction', { emoji, msgId });
  });

  socket.on('report', ({ reason } = {}) => {
    const partnerId = partners.get(socket.id);
    if (!partnerId) return;
    reports.push({
      reporterId: socket.id,
      reporterName: socket.user?.name,
      reportedId: partnerId,
      reason: reason || 'unspecified',
      ts: new Date().toISOString(),
    });
    console.log('[REPORT]', reports[reports.length - 1]);
    socket.emit('report-ack');

    // Auto-skip to next after reporting
    partners.delete(socket.id);
    partners.delete(partnerId);
    io.to(partnerId).emit('partner-disconnected');
    queue.push({ id: socket.id, gender: 'any', lookingFor: 'any', tags: [] });
  });

  socket.on('disconnect', () => {
    const idx = queue.findIndex((u) => u.id === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const partnerId = partners.get(socket.id);
    if (partnerId) {
      partners.delete(partnerId);
      io.to(partnerId).emit('partner-disconnected');
    }
    partners.delete(socket.id);
    broadcastCount(io);
  });
}

module.exports = { registerChatHandlers };
