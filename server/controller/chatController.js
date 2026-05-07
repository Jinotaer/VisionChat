const queue = [];
const partners = new Map();

function registerChatHandlers(io, socket) {
  socket.on('next', () => {
    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const partnerId = partners.get(socket.id);
    if (partnerId) {
      partners.delete(socket.id);
      partners.delete(partnerId);
      io.to(partnerId).emit('partner-disconnected');
    }

    if (queue.length > 0) {
      const waitingId = queue.shift();
      const waitingSocket = io.sockets.sockets.get(waitingId);
      if (!waitingSocket) {
        queue.push(socket.id);
        return;
      }
      partners.set(socket.id, waitingId);
      partners.set(waitingId, socket.id);
      socket.emit('matched', { initiator: true, partnerName: waitingSocket.user.name });
      waitingSocket.emit('matched', { initiator: false, partnerName: socket.user.name });
    } else {
      queue.push(socket.id);
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

  socket.on('message', (text) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('message', text);
  });

  socket.on('disconnect', () => {
    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const partnerId = partners.get(socket.id);
    if (partnerId) {
      partners.delete(partnerId);
      io.to(partnerId).emit('partner-disconnected');
    }
    partners.delete(socket.id);
  });
}

module.exports = { registerChatHandlers };
