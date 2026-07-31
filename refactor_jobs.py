import re

with open("src/pages/Jobs.jsx", "r") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'FileText\n} from "lucide-react";',
    'FileText, Inbox\n} from "lucide-react";\nimport { motion, AnimatePresence } from "framer-motion";\nimport { memo } from "react";'
)

# 2. Filter useMemo
content = content.replace(
    'r.filter(j => [j.company, j.job_title, j.location, j.salary, j.source]',
    'r.filter(j => [j.company, j.job_title, j.location, j.salary, j.source, j.status]'
)

# 3. Skeleton
old_skeleton = """  // ── Skeleton ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-7 w-full">
        <div className="mb-5 h-6 w-16"><Skeleton className="h-full w-full rounded" /></div>
        <div className="mb-4 flex gap-1.5">
          {[48, 64, 60, 56, 72].map(w => <Skeleton key={w} className={`h-7 rounded-md`} style={{ width: w }} />)}
        </div>
        <div className="rounded-[8px] border border-border/60 overflow-hidden">
          <div className="h-9 bg-muted/15 border-b border-border/60" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[44px] flex items-center px-4 gap-4 border-b border-border/40 last:border-0">
              <Skeleton className="w-6 h-6 rounded-[5px] shrink-0" />
              <Skeleton className="h-3 w-[18%]" />
              <Skeleton className="h-3 w-[16%] opacity-70" />
              <Skeleton className="h-3 w-[12%] opacity-60" />
              <Skeleton className="h-3 w-[7%] ml-auto opacity-40" />
              <Skeleton className="h-5 w-[80px] rounded-full opacity-60" />
              <Skeleton className="h-5 w-14 rounded opacity-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }"""

new_skeleton = """  // ── Skeleton ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-7 w-full flex flex-col h-full">
        <div className="mb-5 h-6 w-16"><Skeleton className="h-full w-full rounded" /></div>
        <div className="mb-4 flex gap-1.5">
          {[48, 64, 60, 56, 72].map(w => <Skeleton key={w} className="h-7 rounded-md" style={{ width: w }} />)}
        </div>
        <div className="rounded-[8px] border border-border/60 overflow-hidden bg-card flex-1">
          <div className="h-9 bg-muted/10 border-b border-border/60 flex items-center px-4 gap-4">
             {COLS.map(c => <Skeleton key={c.key} className={cn("h-3", c.w)} />)}
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 flex items-center px-4 gap-4 border-b border-border/40 last:border-0">
              <div className={cn("flex items-center gap-2", COLS[0].w)}>
                 <Skeleton className="w-6 h-6 rounded-[5px] shrink-0" />
                 <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className={cn("h-3 opacity-70", COLS[1].w)} />
              <Skeleton className={cn("h-3 opacity-60", COLS[2].w)} />
              <div className={cn("flex justify-end", COLS[3].w)}><Skeleton className="h-3 w-1/2 opacity-40" /></div>
              <Skeleton className={cn("h-5 rounded-full opacity-60", COLS[4].w)} />
              <Skeleton className={cn("h-5 rounded opacity-40", COLS[5].w)} />
            </div>
          ))}
        </div>
      </div>
    );
  }"""

content = content.replace(old_skeleton, new_skeleton)


# 4. Empty state
old_empty = """        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-52 gap-3">
            <p className="text-[13px] text-muted-foreground">No jobs match your criteria.</p>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Job
            </button>
          </div>
        ) : ("""

new_empty = """        {filtered.length === 0 ? (
          /* Empty state */
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 gap-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-1">
              <Inbox className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground">No jobs found</p>
              <p className="text-[13px] text-muted-foreground mt-1">Try adjusting your filters or add a new job to track.</p>
            </div>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-4 mt-2 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Job
            </button>
          </motion.div>
        ) : ("""

content = content.replace(old_empty, new_empty)

# 5. Table Header padding
content = content.replace(
    '"group px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45 select-none bg-muted/10"',
    '"group px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45 select-none bg-muted/10"'
)


# 6. Table Body Replacement using Regex (since it's huge)
import re
tbody_pattern = re.compile(r"<tbody>.*?</tbody>", re.DOTALL)
new_tbody = """<tbody className="align-middle">
                  <AnimatePresence initial={false}>
                    {filtered.map(job => (
                      <JobTableRow 
                        key={job.id} 
                        job={job} 
                        sal={condenseSalary(job.salary)} 
                        sel={selectedRow === job.id} 
                        cellEditing={cellEditing} 
                        editValue={editValue} 
                        setEditValue={setEditValue} 
                        startEdit={startEdit} 
                        onInputKey={onInputKey} 
                        saveEdit={saveEdit} 
                        setSelectedRow={setSelectedRow} 
                        updateJob={updateJob} 
                        duplicateJob={duplicateJob} 
                        setDeleteTarget={setDeleteTarget} 
                      />
                    ))}
                  </AnimatePresence>
                </tbody>"""

content = tbody_pattern.sub(new_tbody, content)

# 7. Append Component
component = """

// ─── JobTableRow (Memoized for Performance) ───────────────────────────────────
const JobTableRow = memo(({ 
  job, sal, sel, cellEditing, editValue, setEditValue, 
  startEdit, onInputKey, saveEdit, setSelectedRow, 
  updateJob, duplicateJob, setDeleteTarget 
}) => {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedRow(job.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && job.job_url) {
          window.open(job.job_url, "_blank");
        }
      }}
      className={cn(
        "group h-10 border-b border-border/35 last:border-0 cursor-pointer select-none",
        "transition-colors duration-200",
        sel ? "bg-accent/40" : "hover:bg-muted/30"
      )}
    >
      {/* Company */}
      <td
        className="px-3 py-1.5"
        onDoubleClick={() => startEdit(job.id, "company", job.company)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CompanyAvatar company={job.company} logo={job.logo} size={24} />
          
          <div className="flex-1 min-w-0">
            {cellEditing(job.id, "company") ? (
              <input autoFocus value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => onInputKey(e, job.id, "company")}
                onBlur={() => saveEdit(job.id, "company")}
                className="w-full bg-transparent border-none outline-none p-0 text-[13px] font-semibold text-foreground"
              />
            ) : (
              <span 
                className={cn(
                  "text-[13px] font-semibold text-foreground truncate block leading-none",
                  job.job_url && "group-hover:underline hover:text-primary cursor-pointer transition-colors"
                )}
                onClick={(e) => {
                  if (job.job_url) {
                    e.stopPropagation();
                    window.open(job.job_url, "_blank");
                  }
                }}
              >
                {job.company || "—"}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Role */}
      <td
        className="px-3 py-1.5"
        onDoubleClick={() => startEdit(job.id, "job_title", job.job_title)}
      >
        {cellEditing(job.id, "job_title") ? (
          <input autoFocus value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => onInputKey(e, job.id, "job_title")}
            onBlur={() => saveEdit(job.id, "job_title")}
            className="w-full bg-transparent border-none outline-none p-0 text-[13px] font-medium text-foreground"
          />
        ) : (
          <span 
            className={cn(
              "text-[13px] font-medium text-foreground truncate block leading-none",
              job.job_url && "group-hover:underline hover:text-primary cursor-pointer transition-colors"
            )}
            onClick={(e) => {
              if (job.job_url) {
                e.stopPropagation();
                window.open(job.job_url, "_blank");
              }
            }}
          >
            {job.job_title || "—"}
          </span>
        )}
      </td>

      {/* Location */}
      <td
        className="px-3 py-1.5"
        onDoubleClick={() => startEdit(job.id, "location", job.location)}
      >
        <EditableText
          isEditing={cellEditing(job.id, "location")}
          value={job.location} editValue={editValue} onChange={setEditValue}
          onKeyDown={e => onInputKey(e, job.id, "location")} onBlur={() => saveEdit(job.id, "location")}
          textCls="text-[12px] text-muted-foreground font-medium"
        />
      </td>

      {/* Salary */}
      <td
        className="px-3 py-1.5 text-right"
        onDoubleClick={() => startEdit(job.id, "salary", job.salary)}
      >
        <EditableText
          isEditing={cellEditing(job.id, "salary")}
          value={sal} editValue={editValue} onChange={setEditValue}
          onKeyDown={e => onInputKey(e, job.id, "salary")} onBlur={() => saveEdit(job.id, "salary")}
          textCls="text-[12px] tabular-nums font-medium text-foreground/80"
        />
      </td>

      {/* Status */}
      <td className="px-3 py-1.5" onClick={e => e.stopPropagation()}>
        <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
          <SelectTrigger className="h-auto w-full border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden flex justify-start">
            <StatusBadge status={job.status} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {STATUS_ORDER.map(s => (
              <SelectItem key={s} value={s} className="text-[12px]">
                {STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Source */}
      <td className="px-3 py-1.5">
        <div className="scale-90 origin-left">
          <SourceBadge source={job.source} />
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-1.5 text-right" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Job actions" className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/80 transition-colors ml-auto">
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
            <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => startEdit(job.id, "company", job.company)}>
              <Pencil className="w-3 h-3 opacity-50" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => duplicateJob(job)}>
              <Copy className="w-3 h-3 opacity-50" /> Duplicate
            </DropdownMenuItem>
            {job.job_url && (
              <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => window.open(job.job_url, "_blank")}>
                <ExternalLink className="w-3 h-3 opacity-50" /> Open URL
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[12px] gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
});
"""

content += component

with open("src/pages/Jobs.jsx", "w") as f:
    f.write(content)
