Update user
Set user_ip = "", user_connected = 0
Where id In
(
	Select user_id
	From cookie
	Where Date(validity) < Date(Now())
	And Time(validity) < Time(Now());
);

Delete From cookie
Where Date(validity) < Date(Now())
And Time(validity) < Time(Now());