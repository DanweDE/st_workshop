// In this example, we fill the "byLine" field with the combined values of 2 other fields.
// We want to skip this transformation for all German entries.

module.exports = function (migration, {makeRequest}) {
  migration.transformEntries({
    contentType: 'lesson',
    from: ['title', 'modules'],
    to: ['stField'],
    transformEntryForLocale: async function (fromFields, currentLocale) {
      const ids = fromFields.modules['en-US'].map(e => e.sys.id)
      const unsortedEntries = await makeRequest({
        method: 'GET',
        url: `/entries?sys.id[in]=${ids.join(',')}`
      })

      const lessonBlocks = ids.map((id) => unsortedEntries.items.find(entry => entry.sys.id === id))
      const lessonStructuredTextBlocks = lessonBlocks.map(transformLessonBlock)

      return {
        stField: {
          nodeType: 'document',
          nodeClass: 'document',
          content: lessonStructuredTextBlocks
        }
      }

      function transformLessonBlock (lessonBlock) {
        switch (lessonBlock.sys.contentType.sys.id) {
          case 'lessonCopy':
            return transformLessonCopy(lessonBlock)
          case 'lessonImage':
            return transformLessonImage(lessonBlock)
          case 'lessonCodeSnippets':
            return transformLessonCodeSnippets(lessonBlock)
        }
      }

      function transformLessonCopy (lessonBlock) {
        // TODO: copy is a Markdown field! Use Markdown->ST transformer on it!
        const copy = lessonBlock.fields.copy[currentLocale]
        return {
          nodeClass: 'block',
          nodeType: 'paragraph',
          content: [
            {
              nodeClass: 'text',
              nodeType: 'text',
              value: copy,
              marks: []
            },
          ]
        }
      }

      function transformLessonImage (lessonBlock) {
        return createEntryBlockEmbed(lessonBlock)
      }

      function transformLessonCodeSnippets (lessonBlock) {
        return createEntryBlockEmbed(lessonBlock)
      }
    }
  })
}

function createEntryBlockEmbed (entry) {
  const target = {
    sys: {
      type: 'Link',
      linkType: 'Entry',
      id: entry.sys.id
    }
  }
  return {
    nodeClass: 'block',
    nodeType: 'embedded-entry-block',
    data: {
      target
    }
  }
}
