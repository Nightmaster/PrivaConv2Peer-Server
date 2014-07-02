Delete From cookie
Where Date(validity) < Date(Now())
And Time(validity) < Time(Now());