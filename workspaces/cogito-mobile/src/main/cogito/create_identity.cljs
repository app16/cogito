(ns cogito.create-identity
  (:require [reagent.core :as r :refer [atom]]
            ["react-native" :as ReactNative]
            ["react-native-navigation" :as ReactNativeNavigation :refer (Navigation)]))

(def view (r/adapt-react-class (.-View ReactNative)))
(def text (r/adapt-react-class (.-Text ReactNative)))
(def platform (.-Platform ReactNative))

(defn screen-layout []
  [view {:style {:flex-direction "column"
                 :margin 40
                 :align-items "center"
                 :background-color "white"}}

   [text {:style {:font-size 30
                  :font-weight "100"
                  :margin-bottom 20
                  :text-align "center"}}
    "Create Identity"]])

(defn screen []
  (r/create-class
   {:display-name "create-identity"

    :get-initial-state
    (fn [this]
      (let [events (.events Navigation)]
        (.bindComponent events this)))

    :reagent-render screen-layout

    :navigation-button-pressed
    (fn [props]
      (println (.-OS platform))
      (.dismissModal Navigation (.-componentId props)))}))

(defn toolbar-button [id] {:id id :systemItem id})

(def modal-presentation-layout
  (clj->js {:stack {:children
                    [{:component {:name
                                  "CreateIdentity"

                                  :options
                                  {:topBar {:leftButtons
                                            [(toolbar-button "cancel")]}}}}]}}))