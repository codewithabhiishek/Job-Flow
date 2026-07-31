import re

with open("src/pages/Jobs.jsx", "r") as f:
    content = f.read()

# Pattern for mobile view
mobile_pattern = re.compile(r"<div className=\"md:hidden divide-y divide-border/40\">.*?</div>\n          </>\n        \)}", re.DOTALL)

new_mobile = """<div className="md:hidden divide-y divide-border/40">
              <AnimatePresence initial={false}>
                {filtered.map(job => {
                  const sal = condenseSalary(job.salary);
                  return (
                    <motion.div 
                      key={job.id} 
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer"
                      onClick={(e) => {
                        if (job.job_url) {
                          window.open(job.job_url, "_blank");
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyAvatar company={job.company} logo={job.logo} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={cn("text-[13px] font-semibold text-foreground truncate leading-snug", job.job_url && "hover:underline hover:text-primary transition-colors")}>{job.company}</p>
                              <p className={cn("text-[12px] text-foreground/60 font-medium truncate leading-snug", job.job_url && "hover:underline hover:text-primary transition-colors")}>{job.job_title}</p>
                            </div>
                            <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-2">
                              <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                                <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden">
                                  <StatusBadge status={job.status} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="text-[12px]">{STATUS_CONFIG[s].label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button aria-label="Job actions" className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors">
                                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                                  <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => startEdit(job.id, "company", job.company)}><Pencil className="w-3 h-3 opacity-50" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => duplicateJob(job)}><Copy className="w-3 h-3 opacity-50" />Duplicate</DropdownMenuItem>
                                  {job.job_url && <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => window.open(job.job_url, "_blank")}><ExternalLink className="w-3 h-3 opacity-50" />Open URL</DropdownMenuItem>}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}><Trash2 className="w-3 h-3" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                            {job.location && <span className="text-[11.5px] text-muted-foreground/50">{job.location}</span>}
                            {sal && <span className="text-[11.5px] tabular-nums text-muted-foreground/50">{sal}</span>}
                            {job.source && (
                              <div className="scale-90 origin-left">
                                <SourceBadge source={job.source} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}"""

content = mobile_pattern.sub(new_mobile, content)

with open("src/pages/Jobs.jsx", "w") as f:
    f.write(content)
