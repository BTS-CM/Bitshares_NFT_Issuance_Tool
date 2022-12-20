/**
 * Given an IPFS url get the file type
 * @param {String} ipfsURL
 * @returns {String} fileType
 */
function getFileType(ipfsURL) {
  const valueSlice = ipfsURL.substr(ipfsURL.length - 5);
  if (valueSlice.includes('.png') || valueSlice.includes('.PNG')) {
    return 'png';
  }
  if (valueSlice.includes('.gif') || valueSlice.includes('.GIF')) {
    return 'gif';
  }
  if (valueSlice.includes('.jpeg') || valueSlice.includes('.JPEG')) {
    return 'jpeg';
  }
  console.log('Unsupported filetype');
  return null;
}

export { getFileType };
