from sys import stdin
import json
from collections import namedtuple
import copy
from base64 import b64decode, b64encode
from io import BytesIO
from PIL import Image
import numpy as np

PAL = namedtuple('PAL', 'primary secondary')

placeholder = PAL([170,170,170], [85,85,85])

def convert_gbc_pal_to_rgb(pal):
  primary = [x << 3 for x in pal.primary]
  secondary = [x << 3 for x in pal.secondary]

  return PAL(primary, secondary)

def palette_replace(data, old, new):
  result = []
  for row in data:
    for pixel in row:
      if (pixel == old.primary).all():
        result.append(tuple(new.primary))
      elif (pixel == old.secondary).all():
        result.append(tuple(new.secondary))
      else:
        result.append(tuple(pixel))

  return result

def main():
  lines = stdin.readlines()
  params = json.loads(lines[0])
  buffer = BytesIO()

  #print(params['sprite'])
  img = Image.open(BytesIO(b64decode(params['sprite'])))
  #img = Image.open('images/raw/totodile.png')
  width, _ = img.size

  img = img.crop((0, 0, width, width)).convert('RGB')
  data = np.array(img)

  colors = convert_gbc_pal_to_rgb(PAL(params['pal']['primary'],params['pal']['secondary']))
  #colors = convert_gbc_pal_to_rgb(PAL([31,0,0],[0,31,0]))

  new_data = palette_replace(data, placeholder, colors)
  img.putdata(new_data)

  if 'scale' in params and isinstance(params['scale'], int):
    new_width = width * params['scale']
    img = img.resize((new_width, new_width), Image.NEAREST)

  #img.show()
  img.save(buffer, 'PNG')

  print(b64encode(buffer.getvalue()).decode('utf-8'))
  return

main()

def TRANSPARENT_palette_replace(data, old, new):
  white = [255,255,255,255]
  empty = [0,0,0,0]
  result = []
  for row in data:
    new_row = []
    i = 0
    first_foreground = None
    last_foreground = None
    length = len(row)
    while i < length:
      pixel = row[i]
      if first_foreground is None:
        if (pixel == white).all():
          new_row.append(tuple(empty))
          i += 1
        else:
          first_foreground = i
          i = length - 1
      elif last_foreground is None:
        if (pixel == white).all():
          new_row.insert(first_foreground, tuple(empty))
          i -= 1
        else:
          last_foreground = i
          i = first_foreground
      else:
        if (pixel == old.primary).all():
          new_row.insert(i, tuple(new.primary))
        elif (pixel == old.secondary).all():
          new_row.insert(i, tuple(new.secondary))
        else:
          new_row.insert(i, tuple(pixel))
        
        if i is last_foreground:
          i = length # done
        else:
          i += 1

    result = result + new_row

  return result
