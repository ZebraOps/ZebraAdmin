import re
import os

# (file, imports_add, perm_var_init, button_perms)
# button_perms: list of (button_key, perms_needed, old_code, new_code)

updates = [
  # org/dept.tsx
  ("src/views/org/dept.tsx", 
   "import { usePermission } from '@/hooks/usePermission';",
   "  const { hasComp } = usePermission();",
   [
     ("toolBarRender", ["org_dept_add"], 
      "toolBarRender={() => [", 
      "toolBarRender={() => [hasComp('org_dept_add') && "),
     ("addChild", ["org_dept_add"],
      "icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setParentId(row.org_id); setModalOpen(true); }}>子部门",
      "icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setParentId(row.org_id); setModalOpen(true); }} style={{ display: hasComp('org_dept_add') ? 'inline' : 'none' }}>子部门"),
     ("edit", ["org_dept_edit"],
      "icon={<EditOutlined />} onClick={() => { setEditRecord(row); setParentId(row.parent_id ?? null); setModalOpen(true); }}>",
      "icon={<EditOutlined />} onClick={() => { setEditRecord(row); setParentId(row.parent_id ?? null); setModalOpen(true); }} style={{ display: hasComp('org_dept_edit') ? 'inline' : 'none' }}>"),
     ("delete", ["org_dept_delete"],
      "onConfirm={async () => { await api.deleteOrg(row.org_id); message.success('删除成功'); actionRef.current?.reload(); }}",
      "{hasComp('org_dept_delete') && <CountdownButton key=\"del\" icon={<DeleteOutlined />} onConfirm={async () => { await api.deleteOrg(row.org_id); message.success('删除成功'); actionRef.current?.reload(); }} />}"),
   ]),
]

for (filepath, import_stmt, init_stmt, button_updates) in updates:
  if not os.path.exists(filepath):
    print(f"SKIP: {filepath} not found")
    continue
    
  with open(filepath, 'r') as f:
    content = f.read()
  
  # Add import if not present
  if "usePermission" not in content:
    if "import { useAuthStore } from '@/store/auth';" in content:
      content = content.replace(
        "import { useAuthStore } from '@/store/auth';",
        f"import {{ useAuthStore }} from '@/store/auth';\n{import_stmt}"
      )
  
  # Add init if not present
  if "const { hasComp } = usePermission();" not in content:
    if "const { initMenus } = useRouteStore();" in content:
      content = content.replace(
        "const { initMenus } = useRouteStore();",
        f"const {{ initMenus }} = useRouteStore();\n{init_stmt}"
      )
    elif "const { setMenus } = useRouteStore();" in content:
      content = content.replace(
        "const { setMenus } = useRouteStore();",
        f"const {{ setMenus }} = useRouteStore();\n{init_stmt}"
      )
  
  with open(filepath, 'w') as f:
    f.write(content)
  
  print(f"OK: {filepath}")
