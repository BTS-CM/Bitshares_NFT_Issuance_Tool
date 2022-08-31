/**
 * Given an NFT_Object detect the type and urls
 * @param {Object} nft_object 
 * @returns 
 */
function getImages(nft_object) {
    return new Promise(async (resolve, reject) => {
        if (nft_object.media_png_multihashes || nft_object.media_PNG_multihashes) {
            let multihashes = nft_object.media_png_multihashes || nft_object.media_PNG_multihashes
            return resolve(multihashes.map(image => {
                return {url: image.url, type: "PNG"}
            }));
        } else if (nft_object.media_jpeg_multihashes || nft_object.media_JPEG_multihashes) {
            let multihashes = nft_object.media_jpeg_multihashes || nft_object.media_JPEG_multihashes
            return resolve(multihashes.map(image => {
                return {url: image.url, type: "JPEG"}
            }));
        } else if (nft_object.media_gif_multihashes || nft_object.media_GIF_multihashes) {
            let multihashes = nft_object.media_gif_multihashes || nft_object.media_GIF_multihashes
            return resolve(multihashes.map(image => {
                return {url: image.url, type: "GIF"}
            }));
        } else if (nft_object.media_png_multihash || nft_object.media_PNG_multihash) {
            return resolve({
                url: [nft_object.media_png_multihash || nft_object.media_PNG_multihash],
                type: "PNG"
            });
        } else if (nft_object.media_jpeg_multihash || nft_object.media_JPEG_multihash) {
            return resolve({
                url: [nft_object.media_jpeg_multihash || nft_object.media_JPEG_multihash],
                type: 'JPEG'
            });
        } else if (nft_object.media_gif_multihash || nft_object.media_GIF_multihash) {
            return resolve({
                url: [nft_object.media_gif_multihash || nft_object.media_GIF_multihash],
                type: 'GIF'
            });
        } else {
            return resolve();
        }
    });
}


export {
    getImages
}
  