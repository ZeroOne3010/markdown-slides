document.addEventListener('DOMContentLoaded', async function() {

(async function() {
    // Create the slideshow container
    const slideshowContainer = document.createElement('div');
    slideshowContainer.id = 'slideshow';
    document.body.appendChild(slideshowContainer);
  
    // Create navigation buttons
    const prevButton = document.createElement('button');
    prevButton.id = 'prevSlide';
    prevButton.classList.add('nav-button');
    prevButton.innerHTML = '&#9664;'; // Left arrow
    document.body.appendChild(prevButton);
  
    const nextButton = document.createElement('button');
    nextButton.id = 'nextSlide';
    nextButton.classList.add('nav-button');
    nextButton.innerHTML = '&#9654;'; // Right arrow
    document.body.appendChild(nextButton);
  
    // Helper function to fetch content from a file
    async function fetchContent(filename) {
      try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error('File not found');
        return await response.text();
      } catch {
        return null;
      }
    }
  
    // Attempt to load slides.md or README.md
    let markdownContent = await fetchContent('slides.md') || await fetchContent('README.md');
    if (!markdownContent) {
      document.body.innerHTML = '<p style="text-align:center; padding-top:50px;">No <strong>slides.md</strong> or <strong>README.md</strong> file found.</p>';
      return;
    }
  
    // Simple YAML front matter parser
    function parseYamlFrontMatter(content) {
      if (!content.startsWith('---')) return [{}, content];
  
      const endOfFrontMatter = content.indexOf('---', 3);
      if (endOfFrontMatter === -1) return [{}, content];
  
      const yamlText = content.slice(3, endOfFrontMatter).trim();
      const yamlLines = yamlText.split('\n');
      const frontMatter = {};
  
      yamlLines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length > 0) {
          frontMatter[key.trim()] = rest.join(':').trim();
        }
      });
  
      const remainingContent = content.slice(endOfFrontMatter + 3).trim();
      return [frontMatter, remainingContent];
    }
  
    // Simple Markdown parser
    function simpleMarkdownParser(markdown) {
      // Array to hold code blocks
      const codeBlocks = [];
      let placeholderIndex = 0;
  
      // Extract code blocks and replace them with placeholders
      markdown = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        codeBlocks.push({
          code,
          lang
        });
        return `@@CODE${placeholderIndex++}@@`;
      });
  
      // Escape HTML special characters
      markdown = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
      // Headers
      markdown = markdown.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      markdown = markdown.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      markdown = markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
      // Bold and italic
      markdown = markdown.replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>');
      markdown = markdown.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      markdown = markdown.replace(/\*(.+?)\*/g, '<i>$1</i>');
  
      markdown = markdown.replace(/___(.+?)___/g, '<b><i>$1</i></b>');
      markdown = markdown.replace(/__(.+?)__/g, '<b>$1</b>');
      markdown = markdown.replace(/_(.+?)_/g, '<i>$1</i>');
  
      // Unordered lists
      markdown = markdown.replace(/^\s*[-*+] (.+)$/gm, '<ul>\n<li>$1</li>\n</ul>');
      // Merge consecutive <ul> tags
      markdown = markdown.replace(/<\/ul>\n<ul>/g, '');
  
      // Paragraphs
      markdown = markdown.replace(/^\s*(.+)$/gm, '<p>$1</p>');
  
      // Inline code: `code`
      markdown = markdown.replace(/`([^`]+)`/g, '<code>$1</code>');
  
      // Restore code blocks from placeholders
      codeBlocks.forEach((block, index) => {
        // Escape HTML special characters in code content
        let codeContent = block.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
        // Include language class if language identifier is present
        let langClass = block.lang ? ` class="language-${block.lang}"` : '';
  
        // Construct code block HTML
        const codeBlockHtml = `<pre><code${langClass}>${codeContent}</code></pre>`;
  
        // Replace the placeholder with the actual code block HTML
        const placeholder = `@@CODE${index}@@`;
        markdown = markdown.replace(placeholder, codeBlockHtml);
      });
  
      return markdown;
    }
  
    // Parse YAML front matter
    const [frontMatter, contentWithoutFrontMatter] = parseYamlFrontMatter(markdownContent);
  
    // Split content into slides at each first level header
    const slidesContent = contentWithoutFrontMatter.split(/(?=^# )/gm).filter(s => s.trim() !== '');
  
    // Render slides
    slidesContent.forEach((slideMarkdown, index) => {
      const slideDiv = document.createElement('div');
      slideDiv.classList.add('slide');
      if (index === 0) slideDiv.classList.add('active'); // Show the first slide
  
      // Convert Markdown to HTML
      slideDiv.innerHTML = simpleMarkdownParser(slideMarkdown);
      slideshowContainer.appendChild(slideDiv);
    });
  
    // Update document title if provided in front matter
    if (frontMatter.title) {
      document.title = frontMatter.title;
    }
  
    // Slide navigation
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
  
    function showSlide(index) {
      slides[currentSlide].classList.remove('active');
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
    }
  
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        showSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        showSlide(currentSlide - 1);
      }
    });
  
    // Button navigation
    nextButton.addEventListener('click', () => showSlide(currentSlide + 1));
    prevButton.addEventListener('click', () => showSlide(currentSlide - 1));
  })();
});