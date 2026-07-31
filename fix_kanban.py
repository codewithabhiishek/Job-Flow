import re

with open("src/pages/Kanban.jsx", "r") as f:
    content = f.read()

# Container: <motion.div variants={itemAnim} className="flex gap-3 overflow-x-auto flex-1 pb-4">
container_pattern = r'<motion\.div variants=\{itemAnim\} className="flex gap-3 overflow-x-auto flex-1 pb-4">'
container_replacement = '<motion.div variants={itemAnim} className="flex gap-3 overflow-x-auto flex-1 pb-4 snap-x snap-mandatory">'
content = re.sub(container_pattern, container_replacement, content)

# Column: <div key={col.status} className="w-[260px] shrink-0 flex flex-col">
col_pattern = r'<div key=\{col\.status\} className="w-\[260px\] shrink-0 flex flex-col">'
col_replacement = '<div key={col.status} className="w-[260px] shrink-0 flex flex-col snap-center">'
content = re.sub(col_pattern, col_replacement, content)

with open("src/pages/Kanban.jsx", "w") as f:
    f.write(content)

print("Kanban snap-x added")
