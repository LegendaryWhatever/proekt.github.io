  const {Formik, Field, Form} = window.Formik;
  const {createSlice, configureStore} = window.RTK;
  const {combineReducers} = window.Redux;
  const {Provider, connect} = window.ReactRedux;
  const {HashRouter, Route, Switch, withRouter} = window.ReactRouterDOM;
  const OpeningFormSlice = createSlice({ name: 'formOpener',
      initialState: "",
      reducers: {
          WellRequest: (state, action) => {
              if (state === "") return action.payload;
              return state;
          },
          CompleteRequest: state => ""
      }
  });
  const AnimationSlice = createSlice({ name: 'formAnimation',
      initialState: "",
      reducers: {
          endForm: state => "",
          sendOn: state => "wait",
          sendDone: state => "success",
          fail: state => "error"
      }
  });  
  let validateFormCallback = undefined;
  function captchaCallback() { if (validateFormCallback) validateFormCallback();}
  function saveLocalStorage(values) {
      localStorage.setItem("name", values.yourName);
      localStorage.setItem("phone", values.phone);
      localStorage.setItem("email", values.email);
      localStorage.setItem("message", values.message);
      localStorage.setItem("policy", values.policy);
  }
  class MainForm extends React.Component {
      constructor(props) {
          super(props);
          this.ButtonClassAnimation = this.ButtonClassAnimation.bind(this);
          this.WaitingAnimation = this.WaitingAnimation.bind(this);
      }
      ButtonClassAnimation() {
          if(this.props.anime === 'success') return <span className="sendButtonStandart sendButtonAnimeSuccess"> </span>;
          if(this.props.anime === 'error') return <span className="sendButtonStandart sendButtonAnimeFail"> </span>;
          if(this.props.anime === 'wait') {
              window.requestAnimationFrame(this.WaitingAnimation);
              return <span className="sendButtonStandart sendButtonAnimeWaiting"> </span>;
          }
          return <span className="sendButtonStandart sendButtonNoAnimation">ОТПРАВИТЬ</span>;
      }
      WaitingAnimation(timestamp) {
          if (this.start === undefined) this.start = timestamp;
          let elapsed = timestamp - this.start;
          let element = document.querySelector('.sendButtonAnimeWaiting');
          if (element) element.style.setProperty('--rotateTransform', 'rotate(' + (elapsed / 1000 * 360) + 'deg)');
          if (this.props.anime === "wait") {
              window.requestAnimationFrame(this.WaitingAnimation);
          } else {
              this.start = undefined;
          }
      }
      componentDidMount() {
          let captcha = document.getElementById("recaptcha");
          document.getElementById("recaptcha-place").appendChild(captcha);
          this.validateForm();
      }
      componentWillUnmount() {
          let captcha = document.getElementById("recaptcha");
          document.getElementById("recaptcha-store").appendChild(captcha);
          this.props.endForm();
      }
      render() {
          return (
              <div>
                <Formik
                  initialValues={{ yourName: localStorage.getItem("name"), email: localStorage.getItem("email"), phone: localStorage.getItem("phone"), message: localStorage.getItem("message") ,  policy: localStorage.getItem("policy") === "true" }}
                  validate={values => {
                      const errors = {};
                      if (!values.yourName) errors.yourName = 'Required';
                      if (!values.phone) errors.phone = 'Required';
                      if (!values.email) errors.email = 'Required';
                      else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(values.email)) errors.email = 'Invalid';
                      if (!values.policy)  errors.policy = 'Required';
                      if (grecaptcha.getResponse() === "") errors.captcha = 'Required';
                      return errors;
                  }}
                  onSubmit={(values, { setSubmitting }) => {
                      this.props.sendOn();
                      console.log(JSON.stringify(values));
                      const prom = fetch(
                          'https://formcarry.com/s/tZ91Xxlzzl',
                          {
                              method: 'POST',
                              mode: 'cors',
                              cache: 'no-cache',
                              credentials: 'same-origin',
                              headers: {
                                  'Content-Type': 'application/json',
                                  'Accept': 'application/json'
                              },
                              redirect: 'follow',
                              referrerPolicy: 'no-referrer',
                              body: JSON.stringify(values)
                          }
                      );
                      prom.then((response) => {
                          if (response.ok)
                              this.props.sendDone();
                          else
                              this.props.fail();
                          setSubmitting(false);
                      })
                  }}
                >
                    {}
                  {({ isSubmitting, handleChange, handleBlur, values, errors, validateForm}) => 
                  {
                      this.validateForm = validateForm;
                      validateFormCallback = validateForm;
                      console.log(values);
                      saveLocalStorage(values);
                      return (
                    <Form>
                      <Field type="text" name="yourName" placeholder="Ваше имя" valid={errors.yourName? 'false' : 'true'}/>
                      <Field type="text" name="phone" placeholder="Телефон" valid={errors.phone? 'false' : 'true'}/>
                      <Field type="email" name="email" placeholder="E-mail" valid={errors.email? 'false' : 'true'}/>
                      <textarea
                          name="message"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.message}
                          placeholder="Ваш комментарий"
                      />
                      <label htmlFor="policy" className="c_box">
                          <Field type="checkbox" className="cb" id="policy" name="policy" checked={values.policy} />
                          <span className="cb_place"></span>
                          <div>
                              <span className="checkbox-text">
                                  Отправляя заявку, я даю согласие на <a href="">обработку своих персональных данных</a>.
                              </span>
                          </div>
                      </label>
                      <div id="recaptcha-place"></div>
                      <button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
                        {this.ButtonClassAnimation()}
                      </button>
                    </Form>
                  )}}
                </Formik>
              </div>
            );
      }
  }
  function formConnecting(state) {
      const {formAnimation} = state;
      return {anime: formAnimation}
  }
  const mapDispatchForm = {
      endForm: AnimationSlice.actions.endForm,
      sendOn: AnimationSlice.actions.sendOn,
      sendDone: AnimationSlice.actions.sendDone,
      fail: AnimationSlice.actions.fail
  };
  const WrappedMainForm = connect(formConnecting, mapDispatchForm)(MainForm);
  
  class ModalWindow extends React.Component {
      constructor(props) {
          super(props);
          let isOpen = props.location.pathname === "/form";
          if (isOpen) {
              props.history.replace("/");
              props.history.push("/form");
          }
          this.state = {
              animationInProgress: false
          }
          this.OpeningAnimation = this.OpeningAnimation.bind(this);
          this.StartOpenAnimation = this.StartOpenAnimation.bind(this);
          this.ClosingAnimation = this.ClosingAnimation.bind(this);
          this.StartCloseAnimation = this.StartCloseAnimation.bind(this);
          this.handleOffClick = this.handleOffClick.bind(this);
      }
      StartOpenAnimation(id) {
          grecaptcha.reset();
          if (this.state.animationInProgress) return;
          this.setState({animationInProgress: true});
          this.props.history.push("/form");
          this.startingAnimation = undefined;
  
          this.id = id;
          window.requestAnimationFrame(this.OpeningAnimation);
      }
      handleOffClick(e) {
          if (document.getElementById('my-modal').contains(e.target)) return;
          this.StartCloseAnimation();
      }
      StartCloseAnimation() {
          if (this.state.animationInProgress) return;
          this.setState({animationInProgress: true});
          this.startingClosing = undefined;
          if (this.id) {
              let element = document.getElementById(this.id);
              let rect = element.getBoundingClientRect();
              let centerX = (rect.left + rect.right) / 2;
              let centerY = (rect.top + rect.bottom) / 2;
              this.centerString = centerX + "px " + centerY + "px";
          }
          window.requestAnimationFrame(this.ClosingAnimation);
      }
      OpeningAnimation(timestamp) {
          if (this.startingAnimation === undefined) this.startingAnimation = timestamp;
          let elapsed = timestamp - this.startingAnimation;
          document.getElementById('moving-overlay').style.transform = 'scale(' + Math.min(elapsed / 1000, 1) + ')';
          if (this.id) {
              let element = document.getElementById(this.id);
              let rect = element.getBoundingClientRect();
              let centerX = (rect.left + rect.right) / 2;
              let centerY = (rect.top + rect.bottom) / 2;
              let centerString = centerX + "px " + centerY + "px";
              document.getElementById('moving-overlay').style.transformOrigin = centerString;
          }
          document.getElementById('my-fixed-overlay').style.backgroundColor = 'rgba(20, 20, 20, ' +  Math.min(elapsed / 1000 * 0.8, 0.8) + ')'
          if (elapsed < 1000) window.requestAnimationFrame(this.OpeningAnimation);
           else this.setState({animationInProgress: false});
      } 
      ClosingAnimation(timestamp) {
          if (this.startingClosing === undefined) this.startingClosing = timestamp;
          let elapsed = timestamp - this.startingClosing;
          document.getElementById('moving-overlay').style.transform = 'scale(' + (1 - Math.min(elapsed / 1000, 1)) + ')';
          if (this.id) {
              let element = document.getElementById(this.id);
              let rect = element.getBoundingClientRect();
              let centerX = (rect.left + rect.right) / 2;
              let centerY = (rect.top + rect.bottom) / 2;
              let centerString = centerX + "px " + centerY + "px";
              document.getElementById('moving-overlay').style.transformOrigin = centerString;
          }
          document.getElementById('my-fixed-overlay').style.backgroundColor = 'rgba(20, 20, 20, ' + (0.8 - Math.min(elapsed / 1000 * 0.8, 0.8)) + ')'
          if (elapsed < 1000) window.requestAnimationFrame(this.ClosingAnimation);
           else {
              this.setState({animationInProgress: false});
              this.props.history.goBack();
          }
      }
      componentDidUpdate(prevProps) {
          if (this.props.location !== prevProps.location)
              this.setState({animationInProgress: false});
          if (this.props.openRequest !== "") {
              this.StartOpenAnimation(this.props.openRequest);
              this.props.CompleteRequest();
          }
      }
      render() {
          return (
              <Switch>
                  <Route path="/form">
                      <div id="my-fixed-overlay">
                          <div id="moving-overlay" onClick={this.handleOffClick}> 
                              <div id="my-modal">
                                  {this.props.children}
                              </div>
                          </div>
                      </div>
                  </Route>
              </Switch>
          )
      }
  }
  const ReducerCombined = combineReducers({
      formOpener: OpeningFormSlice.reducer,
      formAnimation: AnimationSlice.reducer
  });
  const store = configureStore({reducer: ReducerCombined});
  function clickHandler(e) {
      e.preventDefault();
      store.dispatch(OpeningFormSlice.actions.WellRequest(e.target.id));
  }
  document.querySelectorAll(".form-opener") .forEach((elem) => elem.addEventListener("click", clickHandler));
  function mapStateOpener(state) {
      const {formOpener} = state;
      return {openRequest: formOpener}
  }
  const mapDispatchOpener = {CompleteRequest: OpeningFormSlice.actions.CompleteRequest};
  const WrappedModalWindow = connect(mapStateOpener, mapDispatchOpener)(withRouter(ModalWindow));
  ReactDOM.render((
      <HashRouter>
          <Provider store={store}>
              <WrappedModalWindow> 
                  <WrappedMainForm /> 
              </WrappedModalWindow>
          </Provider>
      </HashRouter>), 
      document.getElementById('react-main'));
