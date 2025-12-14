import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Code2, Database, Cloud, Layers, GitBranch, Terminal, Cpu, Users } from 'lucide-react';

const skills = [
  { 
    name: 'Full-Stack Development', 
    level: 95, 
    icon: Code2,
    description: 'Expert in React, Node.js, TypeScript, and modern web frameworks',
    color: 'from-violet-500 to-purple-600'
  },
  { 
    name: 'Cloud Architecture', 
    level: 90, 
    icon: Cloud,
    description: 'AWS, Azure, GCP - Scalable cloud infrastructure and microservices',
    color: 'from-blue-500 to-cyan-600'
  },
  { 
    name: 'Database Design', 
    level: 88, 
    icon: Database,
    description: 'SQL, NoSQL, Redis - Data modeling and optimization',
    color: 'from-emerald-500 to-teal-600'
  },
  { 
    name: 'DevOps & CI/CD', 
    level: 85, 
    icon: GitBranch,
    description: 'Docker, Kubernetes, Jenkins - Automated deployment pipelines',
    color: 'from-orange-500 to-red-600'
  },
  { 
    name: 'System Architecture', 
    level: 92, 
    icon: Layers,
    description: 'Microservices, event-driven design, scalable systems',
    color: 'from-fuchsia-500 to-pink-600'
  },
  { 
    name: 'AI/ML Integration', 
    level: 80, 
    icon: Cpu,
    description: 'LLM integration, AI-powered features, vector databases',
    color: 'from-yellow-500 to-amber-600'
  },
  { 
    name: 'Technical Leadership', 
    level: 93, 
    icon: Users,
    description: 'Team management, mentoring, architecture decisions',
    color: 'from-indigo-500 to-violet-600'
  },
  { 
    name: 'API Development', 
    level: 94, 
    icon: Terminal,
    description: 'RESTful APIs, GraphQL, WebSockets, real-time systems',
    color: 'from-pink-500 to-rose-600'
  }
];

function SkillBar({ skill, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = skill.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
            <motion.span 
              className="text-sm font-mono text-zinc-400"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
            >
              {skill.level}%
            </motion.span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">{skill.description}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${skill.color} rounded-full shadow-lg`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${skill.level}%` } : { width: 0 }}
          transition={{ 
            duration: 1.2, 
            delay: index * 0.1 + 0.2,
            ease: "easeOut"
          }}
        >
          {/* Animated glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function SkillsSection() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Technical Skills</h2>
            <p className="text-sm text-zinc-400">Core competencies and expertise</p>
          </div>
        </div>

        <div className="space-y-6">
          {skills.map((skill, index) => (
            <SkillBar key={skill.name} skill={skill} index={index} />
          ))}
        </div>

        {/* Additional Skills Tags */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Additional Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {['Python', 'Go', 'Rust', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ', 'Terraform', 'Linux', 'Next.js', 'Vue.js', 'FastAPI', 'gRPC', 'Elasticsearch'].map((tech) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 hover:border-violet-500/50 transition-colors cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </Card>
  );
}