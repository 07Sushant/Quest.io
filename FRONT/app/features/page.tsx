"use client"

import { motion } from 'framer-motion'

export default function FeaturesPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  const features = [
    {
      title: 'AI Quest Assistant',
      desc: 'Converse naturally to research, brainstorm, and learn faster with advanced AI.',
      emoji: '🤖',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/30',
      capabilities: ['Natural conversations', 'Context understanding', 'Multi-turn dialogue', 'Knowledge synthesis']
    },
    {
      title: 'Deep Web Search',
      desc: 'Enriched Google Search Engine Results with AI summaries and intelligent insights.',
      emoji: '🌐',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/30',
      capabilities: ['Real-time search', 'AI summaries', 'Source verification', 'Context enrichment']
    },
    {
      title: 'Vision Understanding',
      desc: 'Ask questions about images. Get context, descriptions, and deep visual insights.',
      emoji: '👁️',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      capabilities: ['Image analysis', 'Text extraction', 'Object detection', 'Scene understanding']
    },
    {
      title: 'Image Generation',
      desc: 'Create stunning visuals from simple prompts, fast and with artistic precision.',
      emoji: '🎨',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/30',
      capabilities: ['Text-to-image', 'Style control', 'High resolution', 'Creative prompts']
    },
    {
      title: 'Art Transform',
      desc: 'Transform your images with creative styles, filters and AI-guided enhancements.',
      emoji: '🖼️',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'from-violet-500/10 to-purple-500/10',
      borderColor: 'border-violet-500/30',
      capabilities: ['Style transfer', 'Image enhancement', 'Artistic filters', 'Creative editing']
    },
    {
      title: 'Speech Synthesis',
      desc: 'Turn text into expressive, natural audio for content creation and accessibility.',
      emoji: '🔊',
      color: 'from-teal-500 to-blue-500',
      bgColor: 'from-teal-500/10 to-blue-500/10',
      borderColor: 'border-teal-500/30',
      capabilities: ['Natural voices', 'Multiple languages', 'Emotion control', 'High quality audio']
    },
  ]

  const benefits = [
    { 
      title: 'Save Time', 
      desc: 'Get short, reliable answers compiled from multiple web sources instantly.',
      icon: '⚡',
      stats: '90% faster'
    },
    { 
      title: 'Create Faster', 
      desc: 'Jump from idea to image or voice in seconds with AI acceleration.',
      icon: '🚀',
      stats: '10x speed'
    },
    { 
      title: 'Understand More', 
      desc: 'Explain complex topics clearly with visual aids and examples.',
      icon: '🧠',
      stats: '3x clarity'
    },
    { 
      title: 'Unified Workflow', 
      desc: 'From research to creation in one seamless, integrated platform.',
      icon: '🔗',
      stats: 'All-in-one'
    },
  ]

  const useCases = [
    { icon: '📊', title: 'Research summaries with verified sources', category: 'Research' },
    { icon: '🎓', title: 'Learning complex topics with visual examples', category: 'Education' },
    { icon: '📱', title: 'Creating marketing visuals and content quickly', category: 'Marketing' },
    { icon: '📋', title: 'Explaining screenshots, charts and documents', category: 'Analysis' },
    { icon: '🎙️', title: 'Generating voice snippets for demos and presentations', category: 'Content' },
    { icon: '🔍', title: 'Deep dive research with AI-powered insights', category: 'Research' }
  ]

  const upcomingFeatures = [
    { 
      icon: '🎵', 
      title: 'Entertainment Model', 
      desc: 'Music & Video Integration with AI curation',
      status: 'In Development',
      progress: 75
    },
    { 
      icon: '🎓', 
      title: 'Classroom Mode', 
      desc: 'Educational AI with student progress tracking',
      status: 'Design Phase',
      progress: 30
    },
    { 
      icon: '🔍', 
      title: 'Deep Search', 
      desc: 'Advanced search with contextual understanding',
      status: 'Beta Testing',
      progress: 85
    },
    { 
      icon: '💻', 
      title: 'Coding Room', 
      desc: 'AI-powered development environment',
      status: 'Planning',
      progress: 15
    },
    { 
      icon: '🧩', 
      title: 'No-code Generator', 
      desc: 'Visual components builder with AI assistance',
      status: 'Prototype',
      progress: 45
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 left-1/6 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <section className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.div
                className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 10, ease: 'linear' },
                  scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                }}
              >
                <img
                  src="https://raw.githubusercontent.com/07Sushant/dump/main/quest.png"
                  alt="Quest logo"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20"></div>
              </motion.div>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Features
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Built for modern search and creation. Powered by OpenAI and Google Search Engine Results.
            </p>
          </motion.div>

          {/* Main Features Grid */}
          <motion.div variants={itemVariants} className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Core Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {feature.emoji}
                      </div>
                      <div className={`w-1 h-12 bg-gradient-to-b ${feature.color} rounded-full`}></div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-white/80 mb-6 leading-relaxed">{feature.desc}</p>
                    <div className="space-y-2">
                      {feature.capabilities.map((capability, capIndex) => (
                        <div key={capIndex} className="flex items-center gap-3 text-sm text-white/70">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                          {capability}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Benefits Section */}
          <motion.div variants={itemVariants} className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Why Choose Quest
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 text-center"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                  <p className="text-white/70 text-sm mb-3">{benefit.desc}</p>
                  <div className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-semibold text-blue-300">
                    {benefit.stats}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Use Cases */}
          <motion.div variants={itemVariants} className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Use Cases & Applications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  variants={itemVariants}
                  whileHover={{ x: 6 }}
                  className="group flex items-start gap-4 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                    {useCase.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 font-medium">
                        {useCase.category}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm">{useCase.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Features */}
          <motion.div variants={itemVariants} className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingFeatures.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <span className="text-xs px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 font-medium">
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-white/70 text-sm mb-4">{item.desc}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 1.5, delay: index * 0.2 }}
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Experience the future of AI-powered search, creation, and analysis with Quest.io
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/30"
              >
                <span>Start Exploring</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  )
}