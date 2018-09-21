// In this example, we fill the "byLine" field with the combined values of 2 other fields.
// We want to skip this transformation for all German entries.

const mdToSt = require('markdown-to-structured-text')
const _ = require('lodash')

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
      const lessonStructuredTextBlocks = _.flatten(lessonBlocks.map(transformLessonBlock))


      const result = {
        stField: {
          nodeType: 'document',
          nodeClass: 'document',
          content: lessonStructuredTextBlocks
        }
      }
      console.log(JSON.stringify(result, null, 2))
      debugger

      return result

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
        try {
          return mdToSt(copy).slate.content.filter(Boolean)
        } catch (e) {
          return []
        }
      }

      function transformLessonImage (lessonBlock) {
        return [createEntryBlockEmbed(lessonBlock)]
      }

      function transformLessonCodeSnippets (lessonBlock) {
        return [createEntryBlockEmbed(lessonBlock)]
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
