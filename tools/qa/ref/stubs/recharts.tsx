import * as React from "react"
const pass = (name: string) => (p: any) => null
export function ResponsiveContainer({ children, ...p }: any) { return <div style={{ width: "100%", height: "100%" }} data-stub="chart" /> }
const names = ["Area","AreaChart","Bar","BarChart","Line","LineChart","Pie","PieChart","Cell","CartesianGrid","XAxis","YAxis","Tooltip","Legend","Label","LabelList","RadialBar","RadialBarChart","PolarGrid","PolarAngleAxis","PolarRadiusAxis","Radar","RadarChart","Sector","ReferenceLine","Rectangle","Brush","ComposedChart","Scatter","ScatterChart"]
const m: any = {}; for (const n of names) m[n] = pass(n)
export const { Area,AreaChart,Bar,BarChart,Line,LineChart,Pie,PieChart,Cell,CartesianGrid,XAxis,YAxis,Tooltip,Legend,Label,LabelList,RadialBar,RadialBarChart,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Radar,RadarChart,Sector,ReferenceLine,Rectangle,Brush,ComposedChart,Scatter,ScatterChart } = m
export type LegendProps = any; export type TooltipProps<A,B> = any
