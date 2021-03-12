const { sitesConfig } = require('lib-global-configs');
const S3Service = require('../utils/s3Service');

const LANGUAGES = {
  ENGLISH: 'english',
  NATIVE: 'native',
};

const DEVICES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
};

const getFiles = async ({ countryCode, language, device }) => {
  const { countryCode: countryCodeConfig } = sitesConfig[countryCode] || {};

  if (countryCodeConfig) {
    const { alpha2 } = countryCodeConfig || {};
    const countryFolder = alpha2.toLowerCase();
    const languageFolder = language.toLowerCase();
    const deviceFolder = device.toLowerCase();

    const Bucket = 'ushop-media.unicity.com';
    const Prefix = `images/quotes/${countryFolder}/${languageFolder}/${deviceFolder}`;
    const list = await S3Service.getFileListAll({ Bucket, Prefix });

    return list.map((r) => `https://ushop-media.unicity.com/${r.Key}`);
  }
};

const getRandomOne = async ({ countryCode, language, device }) => {
  //   const files = await getFiles({
  //     countryCode,
  //     language,
  //     device,
  //   });
  const files = [];

  const randomOne =
    files.length > 0 ? files[Math.floor(Math.random() * files.length)] : null;

  return randomOne;
};

const getRandomSet = async ({ countryCode }) => {
  const requestParams = Object.keys(DEVICES).reduce((list, deviceKey) => {
    const params = { countryCode, device: DEVICES[deviceKey] };
    return [
      ...list,
      { ...params, language: LANGUAGES.ENGLISH },
      { ...params, language: LANGUAGES.NATIVE },
    ];
  }, []);
  const processRequests = requestParams.map(
    ({ countryCode, language, device }) =>
      getRandomOne({ countryCode, language, device })
  );

  const processResponses = await Promise.all(processRequests);
  const mapResults = requestParams
    .map((r, index) => ({ ...r, src: processResponses[index] }))
    .sort((r1) => (r1.language === LANGUAGES.ENGLISH ? -1 : 0)) // English First
    .reduce(
      (obj, r) => {
        if (r.language === LANGUAGES.ENGLISH) {
          obj[r.device][r.language] = r.src;
        } else {
          obj[r.device][r.language] = r.src
            ? r.src
            : obj[r.device][LANGUAGES.ENGLISH]; // use native if not exists
        }
        return obj;
      },
      {
        mobile: {
          english: null,
          native: null,
        },
        tablet: {
          english: null,
          native: null,
        },
        desktop: {
          english: null,
          native: null,
        },
      }
    );

  return mapResults;
};

module.exports = {
  getRandomSet,
};
