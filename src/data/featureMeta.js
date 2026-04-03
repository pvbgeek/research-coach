export const featureMeta = {
  f1: {
    id: 'f1',
    title: 'Research Idea Coach',
    shortDescription: 'Guide your thinking from a vague topic to a solid research question',
    whatItDoes:
      'Guides you from a vague idea to a clear research question through step by step conversation.',
    whatItWontDo:
      'Will not write anything for you or give you a ready made research question.',
    input:
      'Your thoughts, ideas, or topics.',
    output:
      'Coaching questions that help you formulate your own research idea for the project.',
    linkedTo: ['f10', 'f2'],
    independent: false,
  },

  f2: {
    id: 'f2',
    title: 'Literature Explorer',
    shortDescription: 'Find real academic papers and visualize how the field evolved',
    whatItDoes:
      'Finds relevant research work and shows how the field has evolved over time.',
    whatItWontDo:
      'Will not summarize papers for you to copy. Use Deep Dive if you want to understand a paper more deeply.',
    input:
      'Your confirmed research question.',
    output:
      'A list of relevant papers, a visual timeline, and insights about gaps in the field.',
    linkedTo: ['f3'],
    independent: false,
  },

  f3: {
    id: 'f3',
    title: 'Deep Dive & Concept Breakdown',
    shortDescription: 'Break down any paper or article into simple and scientific explanations',
    whatItDoes:
      'Breaks down papers or articles into clear explanations and builds a concept flow.',
    whatItWontDo:
      'Will not write your analysis for you.',
    input:
      'A paper URL, blog link, pasted text, or uploaded PDF.',
    output:
      'Questions and explanations in simple and scientific form, along with a visual concept flow.',
    linkedTo: [],
    independent: false,
  },

  f4: {
    id: 'f4',
    title: 'Citation Validator',
    shortDescription: 'Verify citations, catch wrong years, fake papers, and typos',
    whatItDoes:
      'Checks whether a citation exists and flags issues like incorrect details.',
    whatItWontDo:
      'Will not fix or rewrite your citation, or verify specific claims inside the paper.',
    input:
      'Paste your citation in any format.',
    output:
      'A verification result and a coaching question to guide you.',
    linkedTo: [],
    independent: true,
  },

  f5: {
    id: 'f5',
    title: 'Rubric & Criteria Checker',
    shortDescription: 'Get Socratic feedback on your draft based on a rubric you choose',
    whatItDoes:
      'Helps you evaluate your draft using a selected rubric.',
    whatItWontDo:
      'Will not grade your work or rewrite your draft.',
    input:
      'Choose a rubric type, then paste your draft section.',
    output:
      'Targeted questions based on rubric criteria.',
    linkedTo: [],
    independent: true,
  },

  f6: {
    id: 'f6',
    title: 'Draft Review',
    shortDescription: 'Evaluate your draft for scientific rigor and gets sharper each submission',
    whatItDoes:
      'Reviews your draft for scientific thinking and rigor, adapting with each submission.',
    whatItWontDo:
      'Will not rewrite or fix your draft.',
    input:
      'Paste any section of your draft.',
    output:
      'Focused coaching questions that get sharper with each revision.',
    linkedTo: [],
    independent: true,
  },

  f10: {
    id: 'f10',
    title: 'Research Idea & Novelty Validator',
    shortDescription: 'Check if your research question has already been answered',
    whatItDoes:
      'Checks whether your research question is new or already explored.',
    whatItWontDo:
      'Will not modify or rewrite your research question.',
    input:
      'Your research question.',
    output:
      'A clear verdict and guidance on next steps.',
    linkedTo: ['f2', 'f3'],
    independent: false,
  },
}

export const tileOrder = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f10']