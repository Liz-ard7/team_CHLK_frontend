# Team CHLK Frontend (Vue 3 + Vite)

## Members
* Elizabeth North
* Kelly Hong
* Haolei Zhang
* Calvin Farrow

## View Notes

For writing progress points especially while we haven't linked backend actions or view transitions yet.

### CreateGroup (Kelly)
* useUserStore() in user.js for now just defaults to DemoUser, but once we add in user authentication, this should be modified
* The "Users to Invite" field thus far is such that the user doesn't have to invite anyone right from the get go if they choose not to
* The CreateGroup is available as a tab at the top just to be able to view it right now, but later on the view will be secured behind a button in a different view

### CreateMemory (Kelly)
* The UI Sketches have a "+ Create Group" button in the dropdown menu, but this may complicate things in that the Create! button within the "Create Group" tab would then need to remember which view to transition to --> back to the "Create Memory" tab or to the view of the single group itself. I made the decision to remove the button for simplicity
* The CreateMemory is available as a tab at the top just to be able to view it right now, but later on the view will be secured behind a button in a different view

### EditMemory (Kelly)
* Eventually, when view transitions are created, then the initial values in each of the fields should be that of the memory being edited
* The EditMemory is available as a tab at the top just to be able to view it right now, but later on the view will be secured behind a button in a different view

### Group (Kelly)
* The Memories section of the view will be populated by the memories of the group later when backend storage is connected to everything
* The Group is available as a tab at the top just to be able to view it right now, but later on the view will be secured behind a button in a different view


