"""Builds the people of Rynek Słówek in Blender and saves them for the game.

    pip install bpy          (once: Blender as a Python module; or run inside Blender)
    npm run models           (writes assets/people.glb and assets/people.blend)

One person is built with every hairstyle, hat and prop; the game shows only the pieces
each character wears and recolours the materials, so one small file serves everyone.

Names matter, the game looks them up:
  pivots   Person, torso, head, arm_l/arm_r, forearm_l/forearm_r, leg_l/leg_r, shin_l/shin_r
  pieces   hair_*, hat_*, and moustache, glasses, apron, skirt, backpack, satchel, cane, accordion
  colours  materials skin, shirt, pants, shoes, hair, hat, apron, skirt, bag (recoloured per person)

Blender is Z-up with the person facing -Y; the glTF export turns that into the game's
Y-up, facing +Z. Heights are in metres: about 1.88 m to the top of the head.

To shape people by hand instead, open assets/people.blend, edit, and export it with
File > Export > glTF 2.0 (.glb) to assets/people.glb, keeping the names above. Once you
do, stop running this script, because it rebuilds both files from scratch.
"""
import math
import os

import bpy  # first: bmesh comes with it
import bmesh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def srgb(hex_color):
    """'#RRGGBB' to Blender's linear colour."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


MATS = {}


def mat(name, color, rough=0.75, metal=0.0):
    if name not in MATS:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = srgb(color)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
        m.diffuse_color = srgb(color)
        m.use_backface_culling = False  # exported double-sided: caps and hair are open shells
        MATS[name] = m
    return MATS[name]


# default colours; every person gets their own in the game
for name, color in {
    "skin": "#E8B896", "shirt": "#2B4FB8", "pants": "#2C2F3A", "shoes": "#2B2B2B", "hair": "#3B2A20",
    "hat": "#5B5141", "apron": "#F4EFE6", "skirt": "#6B4B3A", "bag": "#7A4E2D",
    "eye": "#1A1A1A", "mouth": "#9A3F3F", "cheek": "#E79A8A", "frame": "#222222", "wood": "#6B4A30",
    "white": "#F7F5EF", "dark": "#2B2B2B", "accordion": "#B23A3A",
}.items():
    mat(name, color)


def place(obj, parent, loc, rot):
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def pivot(name, parent, loc):
    """An empty the game rotates to animate: a shoulder, an elbow, a hip, a knee."""
    return place(bpy.data.objects.new(name, None), parent, loc, (0, 0, 0))


def mesh_obj(name, bm, material, parent, loc, rot=(0, 0, 0), smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MATS[material])
    for p in me.polygons:
        p.use_smooth = smooth
    return place(bpy.data.objects.new(name, me), parent, loc, rot)


def ellipsoid(name, r, material, parent, loc, rot=(0, 0, 0), seg=(16, 10), cut=None):
    """A stretched sphere; cut=z drops the vertices below that height (for caps and hair)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=1)
    if cut is not None:
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut - 1e-4], context="VERTS")
    bmesh.ops.scale(bm, vec=r, verts=bm.verts)
    return mesh_obj(name, bm, material, parent, loc, rot)


def tube(name, r1, r2, depth, material, parent, loc, rot=(0, 0, 0), seg=12):
    """A cylinder or cone along Z, r1 at the bottom and r2 at the top."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth)
    return mesh_obj(name, bm, material, parent, loc, rot)


def box(name, size, material, parent, loc, rot=(0, 0, 0), bevel=0.02):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, profile=0.5, affect="EDGES")
    return mesh_obj(name, bm, material, parent, loc, rot, smooth=bool(bevel))


def ring(name, radius, thickness, material, parent, loc, rot=(0, 0, 0), seg=18, side=6):
    """A torus around the Z axis (glasses frames)."""
    bm = bmesh.new()
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(side):
            b = 2 * math.pi * j / side
            d = radius + thickness * math.cos(b)
            row.append(bm.verts.new((d * math.cos(a), d * math.sin(a), thickness * math.sin(b))))
        rows.append(row)
    for i in range(seg):
        for j in range(side):
            a, b = rows[i], rows[(i + 1) % seg]
            bm.faces.new((a[j], b[j], b[(j + 1) % side], a[(j + 1) % side]))
    return mesh_obj(name, bm, material, parent, loc, rot)


# ---------------------------------------------------------------- the person
person = pivot("Person", None, (0, 0, 0))

# legs hang from the hips, outside the torso, so a bobbing torso doesn't lift the feet
for side, x in (("l", 0.11), ("r", -0.11)):
    leg = pivot(f"leg_{side}", person, (x, 0, 0.78))
    tube(f"thigh_{side}", 0.085, 0.098, 0.38, "pants", leg, (0, 0, -0.19))
    ellipsoid(f"knee_{side}", (0.088, 0.088, 0.088), "pants", leg, (0, 0, -0.37))
    shin = pivot(f"shin_{side}", leg, (0, 0, -0.37))
    tube(f"calf_{side}", 0.07, 0.086, 0.33, "pants", shin, (0, 0, -0.165))
    box(f"shoe_{side}", (0.12, 0.25, 0.08), "shoes", shin, (0, -0.045, -0.355), bevel=0.03)

torso = pivot("torso", person, (0, 0, 0.8))
ellipsoid("pelvis", (0.2, 0.14, 0.13), "pants", torso, (0, 0, 0.0))
ellipsoid("chest", (0.25, 0.165, 0.32), "shirt", torso, (0, 0, 0.31))
tube("neck", 0.065, 0.06, 0.12, "skin", torso, (0, 0, 0.62))
for side, x in (("l", 0.27), ("r", -0.27)):
    ellipsoid(f"shoulder_{side}", (0.085, 0.085, 0.08), "shirt", torso, (x, 0, 0.52))
    arm = pivot(f"arm_{side}", torso, (x + (0.03 if x > 0 else -0.03), 0, 0.52))
    tube(f"upperarm_{side}", 0.062, 0.074, 0.3, "shirt", arm, (0, 0, -0.15))
    ellipsoid(f"elbow_{side}", (0.064, 0.064, 0.064), "shirt", arm, (0, 0, -0.3))
    fore = pivot(f"forearm_{side}", arm, (0, 0, -0.3))
    tube(f"lowerarm_{side}", 0.052, 0.062, 0.25, "shirt", fore, (0, 0, -0.125))
    ellipsoid(f"hand_{side}", (0.055, 0.04, 0.07), "skin", fore, (0, -0.005, -0.3))

head = pivot("head", torso, (0, 0, 0.86))
ellipsoid("skull", (0.19, 0.185, 0.215), "skin", head, (0, 0, 0.0), seg=(20, 14))
ellipsoid("nose", (0.03, 0.035, 0.04), "skin", head, (0, -0.19, -0.02))
for side, x in (("l", 1), ("r", -1)):
    ellipsoid(f"ear_{side}", (0.03, 0.022, 0.05), "skin", head, (0.19 * x, 0.0, 0.0))
    ellipsoid(f"eye_{side}", (0.024, 0.014, 0.03), "eye", head, (0.07 * x, -0.172, 0.04), seg=(10, 6))
    ellipsoid(f"cheek_{side}", (0.035, 0.012, 0.022), "cheek", head, (0.11 * x, -0.155, -0.04), seg=(10, 6))
ellipsoid("mouth", (0.045, 0.012, 0.012), "mouth", head, (0, -0.178, -0.1), seg=(10, 6))

# hair: the game shows one style per person
ellipsoid("hair_short", (0.21, 0.207, 0.232), "hair", head, (0, 0.016, 0.016), rot=(-0.42, 0, 0), cut=-0.05, seg=(20, 12))
ellipsoid("hair_bun", (0.09, 0.09, 0.09), "hair", head, (0, 0.17, 0.15))
ellipsoid("hair_ponytail", (0.07, 0.08, 0.15), "hair", head, (0, 0.23, -0.04), rot=(0.4, 0, 0))
for side, x in (("l", 1), ("r", -1)):
    ellipsoid(f"hair_pigtails_{side}", (0.07, 0.07, 0.11), "hair", head, (0.2 * x, 0.06, -0.06), rot=(0, 0.35 * x, 0))
    ellipsoid(f"hair_sides_{side}", (0.05, 0.11, 0.06), "hair", head, (0.165 * x, 0.08, -0.01))
ellipsoid("moustache", (0.07, 0.025, 0.022), "hair", head, (0, -0.2, -0.06), seg=(12, 6))

for side, x in (("l", 1), ("r", -1)):
    ring(f"glasses_{side}", 0.045, 0.008, "frame", head, (0.075 * x, -0.19, 0.04), rot=(math.pi / 2, 0, 0))
box("glasses_bridge", (0.05, 0.01, 0.01), "frame", head, (0, -0.195, 0.05), bevel=0)

# hats
tube("hat_toque", 0.16, 0.17, 0.16, "hat", head, (0, 0, 0.2))
ellipsoid("hat_toque_top", (0.21, 0.21, 0.12), "hat", head, (0, 0, 0.3))
ellipsoid("hat_cap", (0.215, 0.215, 0.09), "hat", head, (0, 0.0, 0.15), cut=-0.2)
box("hat_cap_brim", (0.22, 0.12, 0.02), "hat", head, (0, -0.2, 0.13), rot=(-0.15, 0, 0), bevel=0.01)
ellipsoid("hat_kidcap", (0.205, 0.205, 0.17), "hat", head, (0, 0, 0.05), cut=0.0)
box("hat_kidcap_brim", (0.2, 0.16, 0.02), "hat", head, (0, 0.24, 0.07), rot=(0.12, 0, 0), bevel=0.01)
ellipsoid("hat_beret", (0.23, 0.23, 0.07), "hat", head, (0.02, 0.0, 0.17), rot=(0, 0.2, 0))
ellipsoid("hat_scarf", (0.215, 0.21, 0.235), "hat", head, (0, 0.02, 0.0), rot=(-0.75, 0, 0), cut=-0.15)
ellipsoid("hat_scarf_knot", (0.05, 0.04, 0.04), "hat", head, (0, -0.1, -0.22))

# clothes and props
box("apron", (0.4, 0.02, 0.58), "apron", torso, (0, -0.175, 0.15), bevel=0.01)
tube("skirt", 0.31, 0.21, 0.46, "skirt", torso, (0, 0, -0.14), seg=16)
box("backpack", (0.34, 0.16, 0.4), "bag", torso, (0, 0.21, 0.33), bevel=0.04)
box("satchel", (0.08, 0.28, 0.24), "bag", torso, (0.29, -0.02, 0.0), bevel=0.02)
box("satchel_strap", (0.05, 0.02, 0.78), "bag", torso, (0.02, -0.17, 0.32), rot=(0, 0.72, 0), bevel=0)
tube("cane", 0.017, 0.017, 0.92, "wood", bpy.data.objects["forearm_r"], (0, -0.04, -0.72))
acc = pivot("accordion", torso, (0, -0.24, 0.24))
for side, x in (("l", 1), ("r", -1)):
    box(f"accordion_end_{side}", (0.1, 0.2, 0.32), "accordion", acc, (0.16 * x, 0, 0), bevel=0.02)
for i in range(5):
    box(f"accordion_fold_{i}", (0.04, 0.19, 0.3), "dark" if i % 2 else "white", acc, (-0.08 + i * 0.04, 0, 0), bevel=0)
box("accordion_keys", (0.03, 0.15, 0.28), "white", acc, (-0.225, -0.01, 0), bevel=0)

os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "people.blend"))
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "people.glb"), export_format="GLB", export_yup=True,
    export_apply=True, export_materials="EXPORT", export_animations=False,
)
print("Wrote", os.path.join(OUT, "people.glb"), os.path.getsize(os.path.join(OUT, "people.glb")), "bytes")
