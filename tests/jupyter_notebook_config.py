# Configuration file for jupyter-notebook.

from tempfile import mkdtemp


c = get_config()  #noqa

#------------------------------------------------------------------------------
# Application(SingletonConfigurable) configuration
#------------------------------------------------------------------------------
## This is an application.

## The date format used by logging formatters for %(asctime)s
#  Default: '%Y-%m-%d %H:%M:%S'
# c.Application.log_datefmt = '%Y-%m-%d %H:%M:%S'

## The Logging format template
#  Default: '[%(name)s]%(highlevel)s %(message)s'
# c.Application.log_format = '[%(name)s]%(highlevel)s %(message)s'

## Set the log level by value or name.
#  Choices: any of [0, 10, 20, 30, 40, 50, 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']
#  Default: 30
# c.Application.log_level = 30

## Configure additional log handlers.
#  
#  The default stderr logs handler is configured by the log_level, log_datefmt
#  and log_format settings.
#  
#  This configuration can be used to configure additional handlers (e.g. to
#  output the log to a file) or for finer control over the default handlers.
#  
#  If provided this should be a logging configuration dictionary, for more
#  information see:
#  https://docs.python.org/3/library/logging.config.html#logging-config-
#  dictschema
#  
#  This dictionary is merged with the base logging configuration which defines
#  the following:
#  
#  * A logging formatter intended for interactive use called
#    ``console``.
#  * A logging handler that writes to stderr called
#    ``console`` which uses the formatter ``console``.
#  * A logger with the name of this application set to ``DEBUG``
#    level.
#  
#  This example adds a new handler that writes to a file:
#  
#  .. code-block:: python
#  
#     c.Application.logging_config = {
#         "handlers": {
#             "file": {
#                 "class": "logging.FileHandler",
#                 "level": "DEBUG",
#                 "filename": "<path/to/file>",
#             }
#         },
#         "loggers": {
#             "<application-name>": {
#                 "level": "DEBUG",
#                 # NOTE: if you don't list the default "console"
#                 # handler here then it will be disabled
#                 "handlers": ["console", "file"],
#             },
#         },
#     }
#  Default: {}
# c.Application.logging_config = {}

## Instead of starting the Application, dump configuration to stdout
#  Default: False
# c.Application.show_config = False

## Instead of starting the Application, dump configuration to stdout (as JSON)
#  Default: False
# c.Application.show_config_json = False

#------------------------------------------------------------------------------
# JupyterApp(Application) configuration
#------------------------------------------------------------------------------
## Base class for Jupyter applications

## Answer yes to any prompts.
#  Default: False
# c.JupyterApp.answer_yes = False

## Full path of a config file.
#  Default: ''
# c.JupyterApp.config_file = ''

## Specify a config file to load.
#  Default: ''
# c.JupyterApp.config_file_name = ''

## Generate default config file.
#  Default: False
# c.JupyterApp.generate_config = False

## The date format used by logging formatters for %(asctime)s
#  See also: Application.log_datefmt
# c.JupyterApp.log_datefmt = '%Y-%m-%d %H:%M:%S'

## The Logging format template
#  See also: Application.log_format
# c.JupyterApp.log_format = '[%(name)s]%(highlevel)s %(message)s'

## Set the log level by value or name.
#  See also: Application.log_level
# c.JupyterApp.log_level = 30

## 
#  See also: Application.logging_config
# c.JupyterApp.logging_config = {}

## Instead of starting the Application, dump configuration to stdout
#  See also: Application.show_config
# c.JupyterApp.show_config = False

## Instead of starting the Application, dump configuration to stdout (as JSON)
#  See also: Application.show_config_json
# c.JupyterApp.show_config_json = False

#------------------------------------------------------------------------------
# NotebookApp(JupyterApp) configuration
#------------------------------------------------------------------------------
## Set the Access-Control-Allow-Credentials: true header
#  Default: False
# c.NotebookApp.allow_credentials = False

## Set the Access-Control-Allow-Origin header
#  
#          Use '*' to allow any origin to access your server.
#  
#          Takes precedence over allow_origin_pat.
#  Default: ''
# c.NotebookApp.allow_origin = ''

## Use a regular expression for the Access-Control-Allow-Origin header
#  
#          Requests from an origin matching the expression will get replies with:
#  
#              Access-Control-Allow-Origin: origin
#  
#          where `origin` is the origin of the request.
#  
#          Ignored if allow_origin is set.
#  Default: ''
# c.NotebookApp.allow_origin_pat = ''

## Allow password to be changed at login for the notebook server.
#  
#                      While logging in with a token, the notebook server UI will give the opportunity to
#                      the user to enter a new password at the same time that will replace
#                      the token login mechanism.
#  
#                      This can be set to false to prevent changing password from
#  the UI/API.
#  Default: True
# c.NotebookApp.allow_password_change = True

## Allow requests where the Host header doesn't point to a local server
#  
#         By default, requests get a 403 forbidden response if the 'Host' header
#         shows that the browser thinks it's on a non-local domain.
#         Setting this option to True disables this check.
#  
#         This protects against 'DNS rebinding' attacks, where a remote web server
#         serves you a page and then changes its DNS to send later requests to a
#         local IP, bypassing same-origin checks.
#  
#         Local IP addresses (such as 127.0.0.1 and ::1) are allowed as local,
#         along with hostnames configured in local_hostnames.
#  Default: False
# c.NotebookApp.allow_remote_access = False

## Whether to allow the user to run the notebook as root.
#  Default: False
# c.NotebookApp.allow_root = False

## Answer yes to any prompts.
#  See also: JupyterApp.answer_yes
# c.NotebookApp.answer_yes = False

## "
#          Require authentication to access prometheus metrics.
#  Default: True
# c.NotebookApp.authenticate_prometheus = True

## Reload the webapp when changes are made to any Python src files.
#  Default: False
# c.NotebookApp.autoreload = False

## DEPRECATED use base_url
#  Default: '/'
# c.NotebookApp.base_project_url = '/'

## The base URL for the notebook server.
#  
#                                 Leading and trailing slashes can be omitted,
#                                 and will automatically be added.
#  Default: '/'
# c.NotebookApp.base_url = '/'

## Specify what command to use to invoke a web
#                        browser when opening the notebook. If not specified, the
#                        default browser will be determined by the `webbrowser`
#                        standard library module, which allows setting of the
#                        BROWSER environment variable to override it.
#  Default: ''
# c.NotebookApp.browser = ''

## The full path to an SSL/TLS certificate file.
#  Default: ''
# c.NotebookApp.certfile = ''

## The full path to a certificate authority certificate for SSL/TLS client
#  authentication.
#  Default: ''
# c.NotebookApp.client_ca = ''

## Full path of a config file.
#  See also: JupyterApp.config_file
# c.NotebookApp.config_file = ''

## Specify a config file to load.
#  See also: JupyterApp.config_file_name
# c.NotebookApp.config_file_name = ''

## The config manager class to use
#  Default: 'notebook.services.config.manager.ConfigManager'
# c.NotebookApp.config_manager_class = 'notebook.services.config.manager.ConfigManager'

## The notebook manager class to use.
#  Default: 'notebook.services.contents.largefilemanager.LargeFileManager'
# c.NotebookApp.contents_manager_class = 'notebook.services.contents.largefilemanager.LargeFileManager'

## Extra keyword arguments to pass to `set_secure_cookie`. See tornado's
#  set_secure_cookie docs for details.
#  Default: {}
# c.NotebookApp.cookie_options = {}

## The random bytes used to secure cookies.
#          By default this is a new random number every time you start the Notebook.
#          Set it to a value in a config file to enable logins to persist across server sessions.
#  
#          Note: Cookie secrets should be kept private, do not share config files with
#          cookie_secret stored in plaintext (you can read the value from a file).
#  Default: b''
# c.NotebookApp.cookie_secret = b''

## The file where the cookie secret is stored.
#  Default: ''
# c.NotebookApp.cookie_secret_file = ''

## Override URL shown to users.
#  
#          Replace actual URL, including protocol, address, port and base URL,
#          with the given value when displaying URL to the users. Do not change
#          the actual connection URL. If authentication token is enabled, the
#          token is added to the custom URL automatically.
#  
#          This option is intended to be used when the URL to display to the user
#          cannot be determined reliably by the Jupyter notebook server (proxified
#          or containerized setups for example).
#  Default: ''
# c.NotebookApp.custom_display_url = ''

## The default URL to redirect to from `/`
#  Default: '/tree'
# c.NotebookApp.default_url = '/tree'

## Disable cross-site-request-forgery protection
#  
#          Jupyter notebook 4.3.1 introduces protection from cross-site request forgeries,
#          requiring API requests to either:
#  
#          - originate from pages served by this server (validated with XSRF cookie and token), or
#          - authenticate with a token
#  
#          Some anonymous compute resources still desire the ability to run code,
#          completely without authentication.
#          These services can disable all authentication and security checks,
#          with the full knowledge of what that implies.
#  Default: False
# c.NotebookApp.disable_check_xsrf = False

## Whether to enable MathJax for typesetting math/TeX
#  
#          MathJax is the javascript library Jupyter uses to render math/LaTeX. It is
#          very large, so you may want to disable it if you have a slow internet
#          connection, or for offline use of the notebook.
#  
#          When disabled, equations etc. will appear as their untransformed TeX
#  source.
#  Default: True
# c.NotebookApp.enable_mathjax = True

## extra paths to look for Javascript notebook extensions
#  Default: []
# c.NotebookApp.extra_nbextensions_path = []

## handlers that should be loaded at higher priority than the default services
#  Default: []
# c.NotebookApp.extra_services = []

## Extra paths to search for serving static files.
#  
#          This allows adding javascript/css to be available from the notebook server machine,
#          or overriding individual files in the IPython
#  Default: []
# c.NotebookApp.extra_static_paths = []

## Extra paths to search for serving jinja templates.
#  
#          Can be used to override templates from notebook.templates.
#  Default: []
# c.NotebookApp.extra_template_paths = []

#  Default: ''
# c.NotebookApp.file_to_run = ''

## Generate default config file.
#  See also: JupyterApp.generate_config
# c.NotebookApp.generate_config = False

## Extra keyword arguments to pass to `get_secure_cookie`. See tornado's
#  get_secure_cookie docs for details.
#  Default: {}
# c.NotebookApp.get_secure_cookie_kwargs = {}

## Deprecated: Use minified JS file or not, mainly use during dev to avoid JS
#  recompilation
#  Default: False
# c.NotebookApp.ignore_minified_js = False

## (bytes/sec)
#          Maximum rate at which stream output can be sent on iopub before they are
#          limited.
#  Default: 1000000
# c.NotebookApp.iopub_data_rate_limit = 1000000

## (msgs/sec)
#          Maximum rate at which messages can be sent on iopub before they are
#          limited.
#  Default: 1000
# c.NotebookApp.iopub_msg_rate_limit = 1000

## The IP address the notebook server will listen on.
#  Default: 'localhost'
# c.NotebookApp.ip = 'localhost'

## Supply extra arguments that will be passed to Jinja environment.
#  Default: {}
# c.NotebookApp.jinja_environment_options = {}

## Extra variables to supply to jinja templates when rendering.
#  Default: {}
# c.NotebookApp.jinja_template_vars = {}

## The kernel manager class to use.
#  Default: 'notebook.services.kernels.kernelmanager.MappingKernelManager'
# c.NotebookApp.kernel_manager_class = 'notebook.services.kernels.kernelmanager.MappingKernelManager'

## The kernel spec manager class to use. Should be a subclass of
#  `jupyter_client.kernelspec.KernelSpecManager`.
#  
#  The Api of KernelSpecManager is provisional and might change without warning
#  between this version of Jupyter and the next stable one.
#  Default: 'jupyter_client.kernelspec.KernelSpecManager'
# c.NotebookApp.kernel_spec_manager_class = 'jupyter_client.kernelspec.KernelSpecManager'

## The full path to a private key file for usage with SSL/TLS.
#  Default: ''
# c.NotebookApp.keyfile = ''

## Hostnames to allow as local when allow_remote_access is False.
#  
#         Local IP addresses (such as 127.0.0.1 and ::1) are automatically accepted
#         as local as well.
#  Default: ['localhost']
# c.NotebookApp.local_hostnames = ['localhost']

## The date format used by logging formatters for %(asctime)s
#  See also: Application.log_datefmt
# c.NotebookApp.log_datefmt = '%Y-%m-%d %H:%M:%S'

## The Logging format template
#  See also: Application.log_format
# c.NotebookApp.log_format = '[%(name)s]%(highlevel)s %(message)s'

## Set to True to enable JSON formatted logs. Run "pip install notebook[json-
#  logging]" to install the required dependent packages. Can also be set using
#  the environment variable JUPYTER_ENABLE_JSON_LOGGING=true.
#  Default: False
# c.NotebookApp.log_json = False

## Set the log level by value or name.
#  See also: Application.log_level
# c.NotebookApp.log_level = 30

## 
#  See also: Application.logging_config
# c.NotebookApp.logging_config = {}

## The login handler class to use.
#  Default: 'notebook.auth.login.LoginHandler'
# c.NotebookApp.login_handler_class = 'notebook.auth.login.LoginHandler'

## The logout handler class to use.
#  Default: 'notebook.auth.logout.LogoutHandler'
# c.NotebookApp.logout_handler_class = 'notebook.auth.logout.LogoutHandler'

## The MathJax.js configuration file that is to be used.
#  Default: 'TeX-AMS-MML_HTMLorMML-full,Safe'
# c.NotebookApp.mathjax_config = 'TeX-AMS-MML_HTMLorMML-full,Safe'

## A custom url for MathJax.js.
#          Should be in the form of a case-sensitive url to MathJax,
#          for example:  /static/components/MathJax/MathJax.js
#  Default: ''
# c.NotebookApp.mathjax_url = ''

## Sets the maximum allowed size of the client request body, specified in the
#  Content-Length request header field. If the size in a request exceeds the
#  configured value, a malformed HTTP message is returned to the client.
#  
#  Note: max_body_size is applied even in streaming mode.
#  Default: 536870912
# c.NotebookApp.max_body_size = 536870912

## Gets or sets the maximum amount of memory, in bytes, that is allocated for use
#  by the buffer manager.
#  Default: 536870912
# c.NotebookApp.max_buffer_size = 536870912

## Gets or sets a lower bound on the open file handles process resource limit.
#  This may need to be increased if you run into an OSError: [Errno 24] Too many
#  open files. This is not applicable when running on Windows.
#  Default: 0
# c.NotebookApp.min_open_files_limit = 0

## Dict of Python modules to load as notebook server extensions. Entry values can
#  be used to enable and disable the loading of the extensions. The extensions
#  will be loaded in alphabetical order.
#  Default: {}
# c.NotebookApp.nbserver_extensions = {}

## The directory to use for notebooks and kernels.
#  Default: ''
# c.NotebookApp.notebook_dir = ''

## Whether to open in a browser after starting.
#                          The specific browser used is platform dependent and
#                          determined by the python standard library `webbrowser`
#                          module, unless it is overridden using the --browser
#                          (NotebookApp.browser) configuration option.
#  Default: True

c.NotebookApp.password = ''
c.NotebookApp.password_required = False

c.NotebookApp.port = 8888

c.NotebookApp.port_retries = 0
c.NotebookApp.open_browser = False

c.NotebookApp.root_dir = mkdtemp(prefix='galata-test-')
c.NotebookApp.token = ""
c.NotebookApp.disable_check_xsrf = True
c.LabApp.expose_app_in_browser = True