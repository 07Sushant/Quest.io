export interface CodeBlock {
  type: 'code'
  language: string
  code: string
  filename?: string
}

export interface TextBlock {
  type: 'text'
  content: string
}

export type MessageBlock = CodeBlock | TextBlock

export function parseMessageContent(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  
  // Regex to match code blocks with optional language and filename
  const codeBlockRegex = /```(?:(\w+)(?:\s+(.+?))?)?\n([\s\S]*?)```/g
  
  let lastIndex = 0
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim()
      if (textContent) {
        blocks.push({
          type: 'text',
          content: textContent
        })
      }
    }
    
    // Add code block
    const language = match[1] || 'text'
    const filename = match[2]
    const code = match[3].trim()
    
    blocks.push({
      type: 'code',
      language,
      code,
      filename
    })
    
    lastIndex = codeBlockRegex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim()
    if (textContent) {
      blocks.push({
        type: 'text',
        content: textContent
      })
    }
  }
  
  // If no code blocks found, return as single text block
  if (blocks.length === 0) {
    blocks.push({
      type: 'text',
      content: content
    })
  }
  
  return blocks
}

// Language detection for common file extensions
export function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'sql': 'sql',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
    'sh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml'
  }
  
  return ext ? languageMap[ext] || ext : 'text'
}
