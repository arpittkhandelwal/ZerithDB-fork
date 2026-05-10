FROM node:20-slim

# Create a non-root user for Hugging Face
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Copy the bundled server and package info
COPY --chown=user dist/server.cjs ./dist/
COPY --chown=user package.json ./

# Hugging Face Spaces requires port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["node", "dist/server.cjs"]
