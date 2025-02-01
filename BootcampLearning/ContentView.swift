//
//  ContentView.swift
//  BootcampLearning
//
//  Created by ABHINAV ANAND  on 31/01/25.
//



import SwiftUI

struct ContentView: View {  
    @State private var newTask: String = ""
    @ObservedObject var todoViewModel = TodoViewModel()  

    var body: some View {  
        NavigationView {
            VStack {
                HStack {
                    TextField("Enter new task", text: $newTask)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding()

                    Button(action: {
                        if !newTask.isEmpty {
                            todoViewModel.addTodo(title: newTask)
                            newTask = ""  // Clear input
                        }
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.largeTitle)
                            .foregroundColor(.blue)
                    }
                }
                .padding()

                List {
                    ForEach(todoViewModel.todos) { todo in
                        HStack {
                            Text(todo.title)
                                .strikethrough(todo.isCompleted, color: .gray)
                                .foregroundColor(todo.isCompleted ? .gray : .black)
                            
                            Spacer()
                            
                            Button(action: {
                                todoViewModel.toggleCompletion(for: todo)
                            }) {
                                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(todo.isCompleted ? .green : .gray)
                            }
                        }
                        .padding(.vertical, 5)
                    }
                    .onDelete(perform: todoViewModel.removeTodo)  // Swipe to delete
                }
                .listStyle(PlainListStyle())
            }
            .navigationTitle("To-Do List ✅")
        }
    }
}

// ✅ Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
