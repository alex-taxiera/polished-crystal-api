import json
from collections import namedtuple
from base64 import b64decode, b64encode
from io import BytesIO
from PIL import Image

PAL = namedtuple('PAL', 'primary secondary')

placeholder = PAL((170,170,170), (85,85,85))

def convert_gbc_pal_to_rgb(pal):
  primary = tuple([x << 3 for x in pal.primary])
  secondary = tuple([x << 3 for x in pal.secondary])

  return PAL(primary, secondary)

def palette_replace(data, old, new):
  return [
    new.primary if pixel == old.primary
    else new.secondary if pixel == old.secondary
    else pixel
    for pixel in data
  ]

def main():
  params = json.loads(input())

  img = Image.open(BytesIO(b64decode(params['sprite'])))
  #img = Image.open('images/raw/totodile.png')
  width, _ = img.size

  img = img.crop((0, 0, width, width)).convert('RGB')

  colors = convert_gbc_pal_to_rgb(PAL(params['pal']['primary'],params['pal']['secondary']))
  #colors = convert_gbc_pal_to_rgb(PAL([31,0,0],[0,31,0]))
  new_data = palette_replace(list(img.getdata()), placeholder, colors)
  img.putdata(new_data)

  if 'scale' in params and isinstance(params['scale'], int):
    new_width = width * params['scale']
    img = img.resize((new_width, new_width), Image.NEAREST)

  #img.show()

  buffer = BytesIO()
  img.save(buffer, 'PNG')

  print(b64encode(buffer.getvalue()).decode('utf-8'))
  return

main()
