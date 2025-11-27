package sensors

type Group struct {
	Uid   string `json:"uid"`   // uniq group id
	Title string `json:"title"` // group show title
	Col   int    `json:"col"`   // column position of the group
	Row   int    `json:"row"`   // ditto for row
	ColN  int    `json:"col_n"` // the group occupies N columns
	RowN  int    `json:"row_n"` // ditto for rows
	Style string `json:"style"` // css style name of the group
}
