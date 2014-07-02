#!/bin/bash
# $1 is the user used to log in
# $2 is the password for this user
# $3 is the database
# $4 the SQL file to execute
if  [[ $? -ne 0 ]] ; then
	exit 1
fi
mysql -u "$1" "-p$2" "$3" < "$4"
exit 0