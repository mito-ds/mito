declare -a pyversions=("3.6" "3.8" "3.10")

for pyversion in "${pyversions[@]}"
do
    declare -a jupyterlab_packages=("3.0" "3.2" "3.4")
    declare -a ipwidget_packages=("7" "8")
    declare -a jupyterlab_widget_packages=("1" "3")
    
    for jlab_version in "${jupyterlab_packages[@]}"
    do
        for ipywidget_version in "${ipwidget_packages[@]}"
        do
            for jlab_widget_version in "${jupyterlab_widget_packages[@]}"
            do
                version_id="py-$pyversion|jlab-$jlab_version|ipy-$ipywidget_version|jlab-wid-$jlab_widget_version"
                echo "$version_id"
                
                # Create the conda enviornment
                conda create -n "widget-test-$version_id" python="$pyversion"

                # Then, run setup
                conda init --help
                conda activate "widget-test-$version_id"

                # Make sure the Node options are set properly, or later build commands fail
                # with versions of Node > 16
                export NODE_OPTIONS=--openssl-legacy-provider

                # Switch to the mitosheet package, which we develop on by default
                python switch.py mitosheet

                # Install Python dependencies
                pip install -e ".[test, deploy]"

                # Install the npm dependences
                npm install

                # Setup JupyterLab development
                jupyter labextension develop . --overwrite

                # Activate the enviornment
                conda activate "widget-test-$version_id"

                # Finially, install the correct versions
                pip install "jupyterlab==$jlab_version"
                pip install "ipywidget==$ipywidget_version"
                pip install "jupyterlab-widgets==$jlab_widget_version"

                # Then rebuild
                npm run build:dev
            done
        done
    done
done
