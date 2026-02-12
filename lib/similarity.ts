// Simple text similarity algorithm using Jaccard similarity
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))

  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

export function detectDomain(description: string): string {
  const domains = {
    "Machine Learning": ["ml", "machine learning", "neural", "deep learning", "ai", "classification", "regression"],
    "Web Development": ["web", "react", "node", "frontend", "backend", "full stack", "api", "website"],
    IoT: ["iot", "arduino", "raspberry pi", "sensor", "embedded", "automation"],
    "Mobile Development": ["android", "ios", "mobile", "app", "flutter", "react native"],
    Networking: ["network", "router", "tcp", "ip", "socket", "protocol"],
    Cybersecurity: ["security", "encryption", "cyber", "firewall", "vulnerability", "hacking"],
    "Data Science": ["data", "analytics", "visualization", "pandas", "numpy", "statistics"],
    Blockchain: ["blockchain", "cryptocurrency", "smart contract", "ethereum", "bitcoin"],
  }

  const lowerDesc = description.toLowerCase()
  const scores: { [key: string]: number } = {}

  for (const [domain, keywords] of Object.entries(domains)) {
    scores[domain] = keywords.filter((keyword) => lowerDesc.includes(keyword)).length
  }

  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return "Other"

  return Object.keys(scores).find((key) => scores[key] === maxScore) || "Other"
}

export function findSimilarProjects(
  currentProject: { title: string; description: string },
  allProjects: { id: string; title: string; description: string; studentName: string }[],
  threshold = 0.3,
): { project: any; similarity: number }[] {
  const similarities = allProjects.map((project) => {
    const titleSimilarity = calculateSimilarity(currentProject.title, project.title)
    const descSimilarity = calculateSimilarity(currentProject.description, project.description)
    const overallSimilarity = titleSimilarity * 0.6 + descSimilarity * 0.4 // Title weighted more

    return {
      project,
      similarity: overallSimilarity,
    }
  })

  return similarities.filter((s) => s.similarity > threshold).sort((a, b) => b.similarity - a.similarity)
}
