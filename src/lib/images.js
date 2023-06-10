/**
 * Given an NFT_Object detect the type and urls
 * @param {Object} nft_object
 * @returns
 */
function getImages(nft_object) {
  return new Promise(async (resolve, reject) => {
    if (!nft_object) {
      resolve();
      return;
    }

    const multihashKeys = Object.keys(nft_object)
      .filter((key) => (key.includes("media_") && key.includes("_multihashes")) || key.includes("_multihash"));

    resolve(
      multihashKeys.map((key) => {
        const current = nft_object[key];
        const type = key.split("_")[1].toUpperCase();
        const array = key.split("_")[2].includes("multihashes");
        if (array) {
          return current.map((image) => ({ url: image.url, type }));
        }
        return { url: current, type };
      }).flat(),
    );
  });
}

export { getImages };
