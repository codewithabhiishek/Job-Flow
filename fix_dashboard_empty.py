import re

with open("src/pages/Dashboard.jsx", "r") as f:
    content = f.read()

# Add Inbox icon
if "CalendarX2" in content:
    content = content.replace("CalendarX2,", "CalendarX2, Inbox,")

# Find where the stats are rendered
dashboard_stats_start = """  const stats = {"""
replacement_empty_state = """  // Empty search state
  if (filtered.length === 0 && searchQuery) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center text-center max-w-[1200px] mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1">No results found</h3>
        <p className="text-[13px] text-muted-foreground max-w-[260px]">
          We couldn't find any jobs matching "{searchQuery}".
        </p>
      </div>
    );
  }

  const stats = {"""

content = content.replace(dashboard_stats_start, replacement_empty_state)

with open("src/pages/Dashboard.jsx", "w") as f:
    f.write(content)

print("Dashboard empty search state added")
