import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { InputSearchEngine } from "../components/Navbar";
import { API_URL, getToken } from "./userSlice";


export interface Card {
  id?: number;
  title?: string;
  company: string;
  role: string;
  status: string;
  description: string;
  date?: string;
}

interface cardState {
  cards: Card[][];
  cardToUpdate: Card | any;
  arrayDates: string[] | any;
  loading_cards: boolean;
  loading_single_card: boolean;
  grid_columns: number;
  card_error: boolean;
  create_form_active: boolean; 
  searchError: boolean; 
  showCardsByStatus: boolean;
  cardCreatedLoading: boolean;
}

const initialState:cardState = {
  cards: [[]],
  cardToUpdate: {
    company: "",
    role: "",
    status: "",
    description: "",
  },
  arrayDates: [],
  loading_cards: false,
  loading_single_card: false,
  grid_columns: 1,
  card_error: false,
  create_form_active: false,
  searchError: false,
  showCardsByStatus: false,
  cardCreatedLoading: false,
}

export const getCards = createAsyncThunk<Card[][] | any>(
  "cards/getCards",
  async (_, ThunkAPI) => {
    try {
      const { data } = await axios.get(`${API_URL}/cards`, {
        headers: {
          Authorization: getToken(),
        },
      })
      return data
    } catch (error) {
      return ThunkAPI.rejectWithValue(error)
    }
  }
)

export const getCardsBySearchInput = createAsyncThunk<Card[][] | any, Card | any>(
  "cards/getCardsById",
  async (search, ThunkAPI) => { 
    const config = {
      headers: { Authorization: `Bearer ${getToken()}` }
    };
    try {
      const { data } = await axios.get(`${API_URL}/cards/search?input=${search.input}&search=${search.search}`,
        config
      )
      return data;
    } catch (error) {
      ThunkAPI.dispatch(getCards());
      return ThunkAPI.rejectWithValue(error);
    }
  }
)

export const createCard = createAsyncThunk<Object | any, Card | any> (
  "cards/createCard",
  async (card, ThunkAPI) => {
    const config = {
      headers: { Authorization: `Bearer ${getToken()}` }
    };

    try {
      const { data } = await axios.post(`${API_URL}/cards`,
        card,
        config
      )
      ThunkAPI.dispatch(getDates())
      return data.card
    } catch (error) {
      return ThunkAPI.rejectWithValue(error)
    }
  }
)

export const updateCard = createAsyncThunk<Card | any, Card | any>(
  "cards/updateCard",
  async (card, ThunkAPI) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${getToken()}` }
      };
      const { data } = await axios.put(`${API_URL}/cards?card_id=${card.id}`,
        card,
        config
      )
      return data.card
    } catch (error) {
      return ThunkAPI.rejectWithValue(error);
    }
  }
)

export const deleteCard = createAsyncThunk<any, number | undefined>(
  "cards/deleteCard",
  async (id, ThunkAPI) => {
    try {
      const value = await axios.delete(`${API_URL}/cards?card_id=${id}`, {
        headers: {
          Authorization: getToken(),
        },
      })
      return id
    } catch (error) {
      return ThunkAPI.rejectWithValue(error)
    }
  }
)

export const getDates = createAsyncThunk<any | string[]>(
  "cards/getDates",
  async (_, ThunkAPI) => {
    try {
      
      const { data } = await axios.get(`${API_URL}/get_dates`, {
        headers: {
          Authorization: getToken(),
        },
      });
      return data

    } catch (error) {
      return ThunkAPI.rejectWithValue(error)
    }
  }
)
  
export const deleteCardByDate = createAsyncThunk<any, any>(
  "cards/deleteCardByDate",
  async (date, ThunkAPI) => {
    try {
      
      console.log(date)
      const {status} = await axios.delete(`${API_URL}/delete_by_date?date=${date}`, {
        headers: {
          Authorization: getToken(),
        },
      })
      console.log(status)
      if (status === 200) {
        ThunkAPI.dispatch(getCards())
        return date;
      } else {
        return "Error"
      }

    } catch (error) {
      return ThunkAPI.rejectWithValue(error)
    }
  }
)

export const CardSlice = createSlice({
  name: "card",
  initialState: initialState,
  reducers: {
    clearStorage: (state) => {
      state.cards = [[]]
      state.loading_cards = true
      state.loading_single_card = true
    },
    closeCardError: (state) => {
      state.card_error = false
    },
    activateForm: (state) => {
      state.create_form_active = true;
    },
    deactivateForm: (state) => {
        state.create_form_active = false;
        state.cardToUpdate = {}
    },
    setCardToUpdate: (state, action) => {
      state.cardToUpdate = action.payload
      state.create_form_active = true
    },
    cleanCardToUpdate: (state) => {
      state.cardToUpdate = {}
    },
    closeInputError: (state) => {
      state.searchError = false
    },
    setShowByStatus: (state, {payload}) => {
      state.showCardsByStatus = payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCards.pending, (state) => { state.loading_cards = true})
      .addCase(getCards.fulfilled, (state, action) => {
        state.loading_cards = true
        if (state.showCardsByStatus) {
            state.cards = orderByStatus(action.payload)
            state.grid_columns = orderByStatus(action.payload).length
          } else {
            state.cards = action.payload
            state.grid_columns = action.payload.length
          }
        state.loading_cards = false
        state.loading_single_card = false
      })
      .addCase(getCards.rejected, (state) => {
        state.loading_cards = false
        state.loading_single_card = false
      })

    builder
      .addCase(getCardsBySearchInput.pending, (state) => { state.loading_cards = true})
      .addCase(getCardsBySearchInput.fulfilled, (state, action) => {
        state.loading_cards = true
        if (state.showCardsByStatus) {
            state.cards = orderByStatus(action.payload)
            state.grid_columns = orderByStatus(action.payload).length
          } else {
            state.cards = action.payload
            state.grid_columns = action.payload.length
          }
        state.loading_cards = false
        state.loading_single_card = false

      })
      .addCase(getCardsBySearchInput.rejected, (state) => {
        state.loading_cards = false;
        state.searchError = true;
      })

    builder
      .addCase(createCard.pending, (state) => { state.cardCreatedLoading = true})
      .addCase(createCard.fulfilled, (state, action) => {
        if (state.cards[0][1].date !== action.payload.date) {
          state.cards = [
            [
              { title: action.payload.date },
              action.payload
            ],
            ...state.cards
          ]
          state.grid_columns = state.grid_columns + 1
        }
        else if (!state.cards[0].length) {
          state.cards[0] = [{ title: action.payload.date }, action.payload];
        } else {
          const newArray = [
            state.cards[0][0],
            action.payload
          ];
          state.cards[0].map(card => {
            if (!card.title) {
              newArray.push(card)
            }
          })
          state.cards[0] = newArray;
        }
        state.cardCreatedLoading = false
        state.loading_cards = false
        state.create_form_active = false
      })
      .addCase(createCard.rejected, (state) => {
        state.cardCreatedLoading = false
        state.card_error = true
      })

    builder
      .addCase(deleteCard.pending, (state) => { state.loading_single_card = true})
      .addCase(deleteCard.fulfilled, (state, action) => {
        if (state.cards[0].length <= 2 && state.cards[1]) {
          state.cards = state.cards.filter(cardsArray => cardsArray !== state.cards[0])
          state.grid_columns = state.cards.length
        }
        else if (state.cards[0].length <= 2) {
          state.cards[0] = []
          getCards()
        } else {
          state.cards.map((_, index) => {
            state.cards[index] = state.cards[index].filter(card => card.id !== action.payload)
          })
        }
        state.loading_single_card = false
      })
      .addCase(deleteCard.rejected, (state) => {
        state.loading_single_card = false
        state.card_error = true
      })

    builder
      .addCase(updateCard.pending, (state) => { state.cardCreatedLoading = true})
      .addCase(updateCard.fulfilled, (state, action) => {
        state.cards.map((cardArray, index) => {
          cardArray.map((card, ind) => {
            if (card.id === action.payload.id) {
              state.cards[index][ind] = action.payload;
            }
          })
        })
        if (state.showCardsByStatus) {
          state.cards = orderByStatus(state.cards)
          state.grid_columns = orderByStatus(state.cards).length
        } 
        state.cardCreatedLoading = false
        state.create_form_active = false
      })
      .addCase(updateCard.rejected, (state) => {
        state.cardCreatedLoading = false
        state.card_error = true
      })
    
    builder
      .addCase(getDates.fulfilled, (state, action) => {
        state.arrayDates = action.payload;
      })
    builder
      .addCase(deleteCardByDate.fulfilled, (state, action) => {
        state.cards = state.cards.filter(cardsArray => cardsArray[0].title !== action.payload );
        state.arrayDates = state.arrayDates.filter((date: string) => date !== action.payload)
      })
  }
})


function orderByStatus(value:Card[][] | any ): any{
  const applyed = [{ title: "applyed" }];
  const interview = [{ title: "interview" }];
  const rejected = [{ title: "rejected" }];

  value.map((cardArray:Card[]) => {
    cardArray.map((card: Card | any ) => {
      if (card.status === "applyed") {
        if (!card.title) {
          applyed.push(card);
        }
      }
      if (card.status === "interview") {
        if (!card.title) {
          interview.push(card);
        }
      }
      if (card.status === "rejected") {
        if (!card.title) {
          rejected.push(card);
        }
      }
    })
  });

  const CardsFilterByStatus = [];
  if (applyed.length > 1) {
    CardsFilterByStatus.push(applyed)
  }
  if (interview.length > 1) {
    CardsFilterByStatus.push(interview)
  }
  if (rejected.length > 1) {
    CardsFilterByStatus.push(rejected)
  }

  return CardsFilterByStatus
}

export default CardSlice.reducer
export const {
  clearStorage,
  closeCardError,
  activateForm,
  deactivateForm,
  setCardToUpdate,
  cleanCardToUpdate,
  closeInputError,
  setShowByStatus,
} = CardSlice.actions

