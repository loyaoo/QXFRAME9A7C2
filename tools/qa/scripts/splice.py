import re,sys
S='/tmp/claude-0/-home-claude/33a9dde6-00ca-5a12-b42c-ad88ecb4bf0a/scratchpad'
p=S+'/work/qxframe.css'; s=open(p).read(); body=open(S+'/parity.css').read()
s=re.sub(r'/\* QX:SHADCN-PARITY:START \*/[\s\S]*?/\* QX:SHADCN-PARITY:END \*/', lambda m:'/* QX:SHADCN-PARITY:START */\n'+body.strip()+'\n/* QX:SHADCN-PARITY:END */', s, count=1)
open(p,'w').write(s); print('spliced', len(body))
