export function parseMasterFile(content) {
  const regex = /^\/\/\s*===\s*file:\s*(.*?)\s*===\s*$/gm;
  let match;
  const files = [];
  let lastIndex = 0;
  let currentPath = null;

  const pushFile = (path, start, end) => {
    const code = content.slice(start, end).trimStart();
    files.push({ path, code });
  };

  while ((match = regex.exec(content)) !== null) {
    if (currentPath !== null) {
      pushFile(currentPath, lastIndex, match.index);
    }
    currentPath = match[1].trim();
    lastIndex = regex.lastIndex;
  }
  if (currentPath !== null) {
    pushFile(currentPath, lastIndex, content.length);
  }
  return files;
}
