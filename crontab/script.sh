#!/bin/bash

# Crontab shit
# */20 6-23 * * * /bin/bash /home/debian/ICAL-Fac/crontab/script.sh

urls=(
	"msLdRbYEYYgZQTZF" # Obligatoire
	"gB4PsiTT7p7wEByN" # Archi
	"XoskZbjeeT7YYc3d" # JSFS
	"fpq2rQ2qgDCzXFYW" # PDS
	"deoCHgoogEJDzDq6" # GL
	"x55ExgaYbbBfD7WR" # LAAS
	"NDD7KLrWS395Hofj" # LOGIQUE
	"pGHaTgM6X5DofFNc" # OPTIONS
)

# Download all files (hope urls wont change lol)
for url in "${urls[@]}"; do
	wget "https://framagenda.org/remote.php/dav/public-calendars/""$url""/?export" -O "${url}"".ics"
done

# Concat all files into one to get perfs in JS
# https://unix.stackexchange.com/questions/539600/merge-multiple-ics-calendar-files-into-one-file
echo "BEGIN:VCALENDAR" >> calendars; # ICS Convention
for file in *.ics; do 
    cat "$file" | sed -e '$d' $1 | sed -e '1,/VEVENT/{/VEVENT/p;d}' $2  >> calendars; 
done
mv calendars calendars.ics
echo "END:VCALENDAR" >> calendars.ics;

mv calendars.ics ~/ICAL-Fac/icals/
rm *.ics
