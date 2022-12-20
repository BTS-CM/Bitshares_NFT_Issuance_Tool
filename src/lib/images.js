/**
 * Given an NFT_Object detect the type and urls
 * @param {Object} nft_object
 * @returns
 */
function getImages(nft_object) {
  return new Promise(async (resolve, reject) => {
    if (nft_object.media_png_multihashes || nft_object.media_PNG_multihashes) {
      const multihashes = nft_object.media_png_multihashes || nft_object.media_PNG_multihashes;
      resolve(multihashes.map((image) => ({ url: image.url, type: 'PNG' })));
    }
    if (nft_object.media_jpeg_multihashes || nft_object.media_JPEG_multihashes) {
      const multihashes = nft_object.media_jpeg_multihashes || nft_object.media_JPEG_multihashes;
      resolve(multihashes.map((image) => ({ url: image.url, type: 'JPEG' })));
    }
    if (nft_object.media_gif_multihashes || nft_object.media_GIF_multihashes) {
      const multihashes = nft_object.media_gif_multihashes || nft_object.media_GIF_multihashes;
      resolve(multihashes.map((image) => ({ url: image.url, type: 'GIF' })));
    }
    if (nft_object.media_png_multihash || nft_object.media_PNG_multihash) {
      resolve({
        url: [nft_object.media_png_multihash || nft_object.media_PNG_multihash],
        type: 'PNG',
      });
    }
    if (nft_object.media_jpeg_multihash || nft_object.media_JPEG_multihash) {
      resolve({
        url: [nft_object.media_jpeg_multihash || nft_object.media_JPEG_multihash],
        type: 'JPEG',
      });
    }
    if (nft_object.media_gif_multihash || nft_object.media_GIF_multihash) {
      resolve({
        url: [nft_object.media_gif_multihash || nft_object.media_GIF_multihash],
        type: 'GIF',
      });
    }
    resolve();
  });
}

export { getImages };
