// In this example, we fill the "byLine" field with the combined values of 2 other fields.
// We want to skip this transformation for all German entries.

module.exports = function (migration, {makeRequest}) {
  migration.transformEntries({
    contentType: 'lesson',
    from: ['modules'],
    to: ['stField'],
    transformEntryForLocale: async function (fromFields, currentLocale) {
      const ids = fromFields.modules['en-US'].map(e => e.sys.id).join(',')
      const entries = await makeRequest({
        method: 'GET',
        url: `/entries?sys.id[in]=${ids}`
      }) 

      const lessonCopy = entries.items.filter(e => e.sys.contentType.sys.id === 'lessonCopy')
      debugger;
    }
  });
};