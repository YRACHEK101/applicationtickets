export const addCommentToTicket = async (ticketId, { comment }, user, files) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found');

  let attachments = [];
  
  if (files && files.length > 0) {
    // Create folder structure for comment attachments
    const sanitizeFileName = (filename) => {
      return filename.replace(/[^a-zA-Z0-9-_]/g, "-");
    };

    const folderName = sanitizeFileName(ticket.number);
    const ticketDir = path.join(
      process.cwd(),
      "server",
      "uploads",
      "ticket",
      folderName
    );
    
    // Create comments directory inside ticket directory
    const commentsDir = path.join(ticketDir, "comments");
    
    // Create directories if they don't exist
    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir, { recursive: true });
    }
    if (!fs.existsSync(commentsDir)) {
      fs.mkdirSync(commentsDir, { recursive: true });
    }

    // Move files from temp to comments directory
    attachments = await Promise.all(
      files.map(async (file) => {
        const newPath = path.join(commentsDir, path.basename(file.path));
        if (file.path.includes("temp")) {
          await fs.promises.rename(file.path, newPath);
        }

        return {
          name: file.originalname,
          url: `server/uploads/ticket/${folderName}/comments/${path.basename(file.path)}`,
          path: newPath,
        };
      })
    );
  }

  const newComment = {
    text: comment,
    author: `${user.firstName} ${user.lastName}`,
    authorId: user.id,
    createdAt: new Date(),
    attachments: attachments
  };

  // ... rest of the function remains the same