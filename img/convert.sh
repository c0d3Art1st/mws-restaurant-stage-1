#!/bin/sh

SRC="$1"
LOW=60
convert $SRC.jpg -quality $LOW -resize 400x400 $SRC"_400".jpg
convert $SRC.jpg -quality $LOW -resize 600x600 $SRC"_600".jpg
convert $SRC.jpg -quality $LOW -resize 800x800 $SRC"_800".jpg
convert $SRC.jpg -quality $LOW -resize 400x400 $SRC"_400".webp
convert $SRC.jpg -quality $LOW -resize 600x600 $SRC"_600".webp
convert $SRC.jpg -quality $LOW -resize 800x800 $SRC"_800".webp
#convert $SRC.jpg -quality $LOW low_$SRC.webp


# To use this script,
# run the following from a terminal
# in a folder containing an image named foo.jpg (or whatever):
#   chmod u+x convert.sh
#   ./convert.sh foo
