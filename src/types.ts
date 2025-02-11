export interface ResearchSession {
    id: string
    query: string
    urls: string[]
    reports: string[]
    timestamp: Date
  }
  
  export interface Agent {
    id: string
    name: string
    status: "idle" | "working"
    action: string
    position: { x: number; y: number }
  }
  
  export interface TimelineEvent {
    id: string
    title: string
    content: string
    timestamp: Date
    type: "finding" | "analysis" | "conclusion"
  }
  
  export interface GraphNode {
    id: string
    group: "url" | "finding" | "conclusion"
    label: string
    val: number
  }
  
  export interface GraphLink {
    source: string
    target: string
    value: number
  }
  
  export interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
  }
  
  export interface Notification {
    id: string
    message: string
    type: "info" | "success" | "warning"
  }
  
  