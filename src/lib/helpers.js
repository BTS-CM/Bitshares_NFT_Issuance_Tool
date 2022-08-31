/**
 * Given an IPFS url get the file type
 * @param {String} ipfsURL 
 * @returns {String}
 */
function getFileType(ipfsURL) {
    let fileType;
    let valueSlice = ipfsURL.substr(ipfsURL.length - 5);
    if (valueSlice.includes('.png') || valueSlice.includes('.PNG')) {
        fileType = 'png';
    } else if (valueSlice.includes('.gif') || valueSlice.includes('.GIF')) {
        fileType = 'gif';
    } else if (valueSlice.includes('.jpeg') || valueSlice.includes('.JPEG')) {
        fileType = 'jpeg';
    } else {
        console.log('Unsupported filetype');
        return;
    }
    return fileType;
}

export {
    getFileType
}