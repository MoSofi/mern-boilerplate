import React from 'react';
import { connect } from "react-redux";

class Home extends React.Component {
   
	render(){
        return <div>It works fine 👍🏻</div>;
    }
}

const mapStateToProps = state => {
	return {
		generalRdcr: state.GeneralReducer
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		setSocketStatus: status => dispatch(setSocketStatus(status)),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);