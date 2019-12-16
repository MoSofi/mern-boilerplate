const Header = props => {

	return(
		<div id="header" className="container container-wide">
			<a href="/" id="logo-wrap">
				<img src="./images/logo.svg" />
			</a>

			<div className="pull-right" id="header-online-counter">
				
			</div>

			<div className="clearfix"></div>
		</div>
	);
}

export default Header;