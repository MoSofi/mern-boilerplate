export default (state = {
    currentView: 'ENTRY'
}, action) => {
	switch (action.type) {
		case "SET_CURRENT_VIEW":
			state = {
				...state,
				currentView: action.payload
			}

			break;

        default:
            break;
    }

    return state;
}