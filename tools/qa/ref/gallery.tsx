import * as React from "react"
import { Button } from "@/registry/bases/radix/ui/button"
import { Badge } from "@/registry/bases/radix/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/registry/bases/radix/ui/card"
import { Input } from "@/registry/bases/radix/ui/input"
import { Textarea } from "@/registry/bases/radix/ui/textarea"
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemMedia, ItemGroup } from "@/registry/bases/radix/ui/item"
import { Tabs, TabsList, TabsTrigger } from "@/registry/bases/radix/ui/tabs"
import { Field, FieldLabel, FieldDescription, FieldGroup } from "@/registry/bases/radix/ui/field"
import { Checkbox } from "@/registry/bases/radix/ui/checkbox"
import { Switch } from "@/registry/bases/radix/ui/switch"
import { Slider } from "@/registry/bases/radix/ui/slider"
import { Progress } from "@/registry/bases/radix/ui/progress"
import { Separator } from "@/registry/bases/radix/ui/separator"
import { Avatar, AvatarFallback } from "@/registry/bases/radix/ui/avatar"
import { Kbd } from "@/registry/bases/radix/ui/kbd"
import { Alert, AlertTitle, AlertDescription } from "@/registry/bases/radix/ui/alert"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/registry/bases/radix/ui/empty"
import { Skeleton } from "@/registry/bases/radix/ui/skeleton"
import { Select, SelectTrigger, SelectValue } from "@/registry/bases/radix/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/registry/bases/radix/ui/table"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/registry/bases/radix/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/registry/bases/radix/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/registry/bases/radix/ui/toggle-group"
import { ButtonGroup } from "@/registry/bases/radix/ui/button-group"
import { IconPlaceholder } from "./stubs/icon"
const I = () => <IconPlaceholder lucide="PlusIcon" />
const S = ({ id, children }: any) => <div data-spec={id} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>{children}</div>
export default function Gallery() {
  const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
  const sizes = ["xs", "sm", "default", "lg"] as const
  return <div style={{ padding: 24, width: 1200 }} className="bg-background">
    {sizes.map(s => <S key={s} id={"button-" + s}>{variants.map(v => <Button key={v} data-spec={`button-${s}-${v}`} size={s} variant={v}>{v}</Button>)}
      <Button data-spec={`button-icon-${s}`} size={(s === "default" ? "icon" : "icon-" + s) as any} variant="outline"><I /></Button></S>)}
    <S id="badge">{["default", "secondary", "outline", "destructive", "ghost"].map(v => <Badge key={v} data-spec={"badge-" + v} variant={v as any}>{v}</Badge>)}</S>
    {["default", "sm"].map(sz => <div key={sz} style={{ width: 360, marginBottom: 16 }}><Card data-spec={"card-" + sz} size={sz as any}>
      <CardHeader data-spec={"card-header-" + sz}><CardTitle data-spec={"card-title-" + sz}>Card title</CardTitle><CardDescription data-spec={"card-desc-" + sz}>Card description text</CardDescription><CardAction data-spec={"card-action-" + sz}><Badge>New</Badge></CardAction></CardHeader>
      <CardContent data-spec={"card-content-" + sz}><p data-spec={"card-p-" + sz}>Body copy</p></CardContent>
      <CardFooter data-spec={"card-footer-" + sz}><Button data-spec={"card-footer-btn-" + sz} variant="outline">Cancel</Button></CardFooter></Card></div>)}
    <S id="input"><Input data-spec="input" placeholder="Input" /><Textarea data-spec="textarea" placeholder="Textarea" /></S>
    <S id="input-group"><InputGroup data-spec="input-group"><InputGroupInput data-spec="input-group-input" placeholder="Search" /><InputGroupAddon data-spec="input-group-addon"><I /></InputGroupAddon><InputGroupAddon align="inline-end"><InputGroupButton data-spec="input-group-button" size="icon-xs"><I /></InputGroupButton></InputGroupAddon></InputGroup></S>
    <S id="select"><Select><SelectTrigger data-spec="select-trigger" className="w-40"><SelectValue placeholder="Select" /></SelectTrigger></Select><Select><SelectTrigger data-spec="select-trigger-sm" size="sm" className="w-40"><SelectValue placeholder="Select sm" /></SelectTrigger></Select></S>
    {["default", "outline", "muted"].map(v => ["default", "sm", "xs"].map(sz => <div key={v + sz} style={{ width: 360, marginBottom: 8 }}><Item data-spec={`item-${v}-${sz}`} variant={v as any} size={sz as any}><ItemMedia data-spec={`item-media-${v}-${sz}`} variant="icon"><I /></ItemMedia><ItemContent data-spec={`item-content-${v}-${sz}`}><ItemTitle data-spec={`item-title-${v}-${sz}`}>Item title</ItemTitle><ItemDescription data-spec={`item-desc-${v}-${sz}`}>Item description</ItemDescription></ItemContent><ItemActions data-spec={`item-actions-${v}-${sz}`}><Button size="sm" variant="outline">Act</Button></ItemActions></Item></div>))}
    <S id="tabs"><Tabs defaultValue="a"><TabsList data-spec="tabs-list"><TabsTrigger data-spec="tabs-trigger-active" value="a">Account</TabsTrigger><TabsTrigger data-spec="tabs-trigger" value="b">Password</TabsTrigger></TabsList></Tabs>
      <Tabs defaultValue="a"><TabsList data-spec="tabs-list-line" variant="line"><TabsTrigger data-spec="tabs-trigger-line-active" value="a">Account</TabsTrigger><TabsTrigger value="b">Password</TabsTrigger></TabsList></Tabs></S>
    <div style={{ width: 360 }}><FieldGroup data-spec="field-group"><Field data-spec="field"><FieldLabel data-spec="field-label">Label</FieldLabel><Input placeholder="x" /><FieldDescription data-spec="field-desc">Help text</FieldDescription></Field><Field orientation="horizontal" data-spec="field-h"><Checkbox data-spec="checkbox" defaultChecked /><FieldLabel>Check</FieldLabel></Field></FieldGroup></div>
    <S id="controls"><Switch data-spec="switch" defaultChecked /><Switch data-spec="switch-off" /><Checkbox data-spec="checkbox-off" /><RadioGroup defaultValue="a"><RadioGroupItem data-spec="radio" value="a" /></RadioGroup>
      <div style={{ width: 200 }}><Slider data-spec="slider" defaultValue={[50]} /></div><div style={{ width: 200 }}><Progress data-spec="progress" value={40} /></div></S>
    <S id="misc"><Avatar data-spec="avatar"><AvatarFallback>CN</AvatarFallback></Avatar><Avatar data-spec="avatar-sm" size="sm"><AvatarFallback>CN</AvatarFallback></Avatar><Kbd data-spec="kbd">⌘K</Kbd><Skeleton data-spec="skeleton" className="h-4 w-20" /><div style={{ width: 100 }}><Separator data-spec="separator" /></div>
      <ToggleGroup type="single" defaultValue="a" variant="outline" data-spec="toggle-group"><ToggleGroupItem data-spec="toggle-item-on" value="a">A</ToggleGroupItem><ToggleGroupItem data-spec="toggle-item" value="b">B</ToggleGroupItem></ToggleGroup>
      <ButtonGroup data-spec="button-group"><Button variant="outline">One</Button><Button variant="outline">Two</Button></ButtonGroup></S>
    <div style={{ width: 360, marginBottom: 16 }}><Alert data-spec="alert"><I /><AlertTitle data-spec="alert-title">Alert title</AlertTitle><AlertDescription data-spec="alert-desc">Alert description</AlertDescription></Alert></div>
    <div style={{ width: 360, marginBottom: 16 }}><Empty data-spec="empty"><EmptyHeader><EmptyMedia data-spec="empty-media" variant="icon"><I /></EmptyMedia><EmptyTitle data-spec="empty-title">No items</EmptyTitle><EmptyDescription data-spec="empty-desc">Nothing here yet</EmptyDescription></EmptyHeader><EmptyContent><Button size="sm">Add</Button></EmptyContent></Empty></div>
    <div style={{ width: 360 }}><Table data-spec="table"><TableHeader><TableRow><TableHead data-spec="table-head">Head</TableHead><TableHead>Two</TableHead></TableRow></TableHeader><TableBody><TableRow data-spec="table-row"><TableCell data-spec="table-cell">Cell</TableCell><TableCell>2</TableCell></TableRow></TableBody></Table></div>
  </div>
}
