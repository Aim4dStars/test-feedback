const pdfParse = require('pdf-parse');

/**
 * Extract text per page from a PDF buffer using pdf-parse.
 * Returns array of { page: number, text: string }
 */
async function getTextByPage(buffer) {
  const pages = [];

  // pdf-parse supports a pagerender option that is called per page
  const options = {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(function (textContent) {
        const text = textContent.items.map(item => item.str).join(' ');
        pages.push({ page: pageData.pageNumber, text });
        return text;
      });
    },
  };

  await pdfParse(buffer, options);
  pages.sort((a, b) => a.page - b.page);
  return pages;
}

module.exports = { getTextByPage };
