const { TranslationServiceClient } = require('@google-cloud/translate');

const translationClient = new TranslationServiceClient({
    keyFilename: `./src/configs/googleApplicationCredentials.json`,
});
const projectId = 'ushopadmin'
const location = 'us-central1'

const translateText = async (source, target, content) => {
    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [content],
        mimeType: 'text/plain',
        sourceLanguageCode: source,
        targetLanguageCode: target,
    };
    const [res] = await translationClient.translateText(request) || [];
    const { translations } = res || {}
    const [firstRow] = translations || []
    const { translatedText } = firstRow || {}
    return translatedText
}


const translateMultiple = async listOfTranslate => {
    const reqProgresses = listOfTranslate.map(({ source, target, content }) => translateText(source, target, content))
    const resProgresses = await Promise.allSettled(reqProgresses)

    return resProgresses
}

module.exports = {
    translateText,
    translateMultiple
}