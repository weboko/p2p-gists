// Prism.js initialization and language loading
import Prism from 'prismjs';

// Core Prism setup
if (typeof window !== 'undefined') {
  // Ensure Prism is available globally
  window.Prism = Prism;
  
  // Configure Prism
  Prism.manual = true; // Disable automatic highlighting
}

// Language loading function
export async function loadPrismLanguage(language) {
  // Map of language names to Prism component names
  const languageMap = {
    javascript: 'javascript',
    python: 'python', 
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rust',
    css: 'css',
    html: 'markup',
    sql: 'sql',
    json: 'json',
    yaml: 'yaml',
    markdown: 'markdown',
    bash: 'bash',
    shell: 'bash',
    typescript: 'typescript',
    php: 'php',
    ruby: 'ruby'
  };

  const prismLang = languageMap[language];
  
  if (!prismLang || prismLang === 'text') {
    return false;
  }

  // Check if language is already loaded
  if (Prism.languages[prismLang]) {
    return true;
  }

  try {
    // Dynamically import the language component
    switch (prismLang) {
      case 'javascript':
        await import('prismjs/components/prism-javascript');
        break;
      case 'python':
        await import('prismjs/components/prism-python');
        break;
      case 'java':
        await import('prismjs/components/prism-java');
        break;
      case 'cpp':
        // C++ depends on C, so load C first
        if (!Prism.languages.c) {
          await import('prismjs/components/prism-c');
        }
        await import('prismjs/components/prism-cpp');
        break;
      case 'c':
        await import('prismjs/components/prism-c');
        break;
      case 'go':
        await import('prismjs/components/prism-go');
        break;
      case 'rust':
        await import('prismjs/components/prism-rust');
        break;
      case 'css':
        await import('prismjs/components/prism-css');
        break;
      case 'markup':
        await import('prismjs/components/prism-markup');
        break;
      case 'sql':
        await import('prismjs/components/prism-sql');
        break;
      case 'json':
        await import('prismjs/components/prism-json');
        break;
      case 'yaml':
        await import('prismjs/components/prism-yaml');
        break;
      case 'markdown':
        // Markdown depends on markup
        if (!Prism.languages.markup) {
          await import('prismjs/components/prism-markup');
        }
        await import('prismjs/components/prism-markdown');
        break;
      case 'bash':
        await import('prismjs/components/prism-bash');
        break;
      case 'typescript':
        // TypeScript depends on JavaScript
        if (!Prism.languages.javascript) {
          await import('prismjs/components/prism-javascript');
        }
        await import('prismjs/components/prism-typescript');
        break;
      case 'php':
        // PHP depends on markup
        if (!Prism.languages.markup) {
          await import('prismjs/components/prism-markup');
        }
        await import('prismjs/components/prism-php');
        break;
      case 'ruby':
        await import('prismjs/components/prism-ruby');
        break;
      default:
        return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`Failed to load Prism language: ${language}`, error);
    return false;
  }
}

// Highlight code with automatic language loading
export async function highlightCode(code, language) {
  if (!code || !language || language === 'text') {
    return code;
  }

  try {
    // Load the language if needed
    const loaded = await loadPrismLanguage(language);
    
    if (!loaded) {
      return code;
    }

    // Map language to Prism language identifier
    const languageMap = {
      javascript: 'javascript',
      python: 'python',
      java: 'java', 
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rust',
      css: 'css',
      html: 'markup',
      sql: 'sql',
      json: 'json',
      yaml: 'yaml',
      markdown: 'markdown',
      bash: 'bash',
      shell: 'bash',
      typescript: 'typescript',
      php: 'php',
      ruby: 'ruby'
    };

    const prismLang = languageMap[language];
    
    if (prismLang && Prism.languages[prismLang]) {
      return Prism.highlight(code, Prism.languages[prismLang], prismLang);
    }
    
    return code;
  } catch (error) {
    console.warn(`Failed to highlight code for language: ${language}`, error);
    return code;
  }
}

export default Prism; 